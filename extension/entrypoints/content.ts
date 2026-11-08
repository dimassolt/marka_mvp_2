import tokens from '@/assets/tokens.css?raw';
import { engineRunning, type Finding, type RephraseFailure, type RephraseResult } from '@/utils/engine-status';
import { customDomains, isSiteOn, pausedSites, selectedDomain, sites } from '@/utils/popup-settings';
import { sentenceAround } from '@/utils/sentence';
import { colourOf, movedStart, pointAt, type Colour, type Piece } from '@/utils/underlines';

/** Scan 1 s after the last keystroke (docs/spec.md §3), so typing doesn't send every word. */
const TYPING_PAUSE_MS = 1000;
const COLOURS: Colour[] = ['id', 'contact', 'domain'];
/** Elements that start a new line; the Extension puts a line break before each. */
const BLOCKS = new Set(['P', 'DIV', 'LI', 'PRE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
/** How far a wavy underline reaches below the text: 4px offset, 1.5px line, the wave itself. */
const UNDERLINE_ROOM_PX = 8;
/** Computed styles copied from a <textarea>, so its overlay wraps the text on the same lines. */
const COPIED_STYLES = [
  'direction', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderStyle', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle',
  'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontFamily', 'fontFeatureSettings',
  'fontKerning', 'lineHeight', 'letterSpacing', 'wordSpacing', 'textAlign', 'textTransform',
  'textIndent', 'tabSize', 'wordBreak', 'overflowWrap',
] as const;

/** How long the Card stays after the pointer leaves the Finding, so the pointer can reach it. */
const CARD_LINGER_MS = 300;
/** Room between a Finding and its Card, and between the Card and the window's edge. */
const CARD_GAP_PX = 8;
const CARD_WIDTH_PX = 300;

/** What the Card says when there is no rephrased sentence (docs/spec.md §3, Engine down). */
const REPHRASE_FAILURES: Record<RephraseFailure, string> = {
  'engine-down': 'Engine not running',
  'model-missing': 'Rephrase model not downloaded. Run make start.',
  unsafe: "Couldn't rephrase without sensitive data. Use Hide.",
  timeout: 'Rephrasing took too long. Try again.',
  failed: "Couldn't rephrase. Try again.",
};

/** An invisible copy of a <textarea>'s text laid over it: highlights can't reach inside a textarea. */
interface Overlay {
  box: HTMLDivElement;
  text: Text;
}

/** One underlined Finding: where it is in the field's joined text, and its Range on screen. */
interface Underline {
  field: HTMLElement;
  start: number;
  end: number;
  value: string;
  category: string;
  prefix: string;
  name: string;
  colour: Colour;
  range: Range;
}

export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    addUnderlineStyles();

    const underlined = new Map<HTMLElement, Underline[]>();
    const watched = new WeakSet<HTMLElement>();
    const overlays = new WeakMap<HTMLTextAreaElement, Overlay>();
    const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
    // Each field's text as the Extension last saw it: what its underlines' offsets count in.
    const texts = new WeakMap<HTMLElement, string>();
    // Ignored (Category, value) pairs per field, until the message is sent (spec §3, Ignore).
    const ignored = new WeakMap<HTMLElement, Set<string>>();
    // Off until the site settings are read, so no text reaches the Engine on a site switched off.
    let siteOn = false;
    // The field the user last focused: the Ghost bar shows its Findings.
    let current: HTMLElement | null = null;

    const schedule = (field: HTMLElement, delay: number) => {
      clearTimeout(timers.get(field));
      timers.set(field, setTimeout(() => scan(field), delay));
    };

    // An empty field means the message was sent: its values are flagged again (spec §3, Ignore).
    // Checked on every change, since typing the next message may start before the scan runs.
    const changed = (field: HTMLElement) => {
      const text = joined(piecesOf(field));
      if (!text.trim()) ignored.delete(field);
      move(field, text);
      schedule(field, TYPING_PAUSE_MS);
    };

    // The site rewrites the text as the user types, which empties the underlines' Ranges.
    // Each Finding the edit didn't touch gets a new Range at its moved place, so underlines
    // don't blink until the next scan; one the user typed inside waits for that scan.
    const move = (field: HTMLElement, text: string) => {
      const before = texts.get(field);
      texts.set(field, text);
      const list = underlined.get(field);
      if (before === undefined || before === text || !list?.length) return;
      const pieces = piecesOf(field);
      underlined.set(
        field,
        list.filter((u) => {
          const start = movedStart(before, text, u.start, u.end);
          const range = start === undefined ? undefined : rangeOf(pieces, start, start + u.value.length);
          if (start === undefined || !range) return false;
          // Changed in place, so an open Card keeps pointing at its Finding.
          Object.assign(u, { start, end: start + u.value.length, range });
          return true;
        }),
      );
      draw();
    };

    // Any change in the field, however the site makes it, schedules a scan.
    const watch = (field: HTMLElement | null) => {
      if (!field || watched.has(field)) return;
      watched.add(field);
      if (field instanceof HTMLTextAreaElement) {
        const overlay = createOverlay();
        overlays.set(field, overlay);
        follow(field, overlay);
      } else {
        new MutationObserver(() => changed(field)).observe(field, {
          subtree: true,
          childList: true,
          characterData: true,
        });
      }
      schedule(field, 0);
    };

    // Each frame: keep the overlay on the textarea, and notice new text. A site can change
    // a textarea's value without any event (e.g. emptying it after Send), so this always runs;
    // only placing the overlay waits until the field has Findings to underline.
    const follow = (field: HTMLTextAreaElement, overlay: Overlay) => {
      if (!field.isConnected) {
        overlay.box.remove();
        underlined.delete(field);
        draw();
        return;
      }
      if (underlined.get(field)?.length) placeOverlay(field, overlay);
      if (overlay.text.data !== field.value) {
        overlay.text.data = field.value;
        changed(field);
      }
      requestAnimationFrame(() => follow(field, overlay));
    };

    /** The field's text in pieces; for a textarea, its overlay's single text node. */
    const piecesOf = (field: HTMLElement): Piece<Text>[] => {
      const overlay = field instanceof HTMLTextAreaElement && overlays.get(field);
      if (!overlay) return readField(field);
      if (overlay.text.data !== field.value) overlay.text.data = field.value;
      return [{ node: overlay.text, text: field.value }];
    };

    async function scan(field: HTMLElement) {
      const pieces = piecesOf(field);
      const text = joined(pieces);
      const findings: Finding[] = siteOn && text.trim()
        ? await browser.runtime.sendMessage({ type: 'detect', text }).catch(() => [])
        : [];
      // The user typed while the Engine answered: these offsets are stale. Scan again.
      if (joined(piecesOf(field)) !== text) return schedule(field, TYPING_PAUSE_MS);

      texts.set(field, text);
      underlined.set(
        field,
        findings.flatMap(({ start, end, category, prefix = 'DATA', name = category, group }) => {
          const value = text.slice(start, end);
          if (ignored.get(field)?.has(ignoreKey(category, value))) return [];
          const range = rangeOf(pieces, start, end);
          if (!range) return [];
          return [{ field, start, end, value, category, prefix, name, colour: colourOf(group), range }];
        }),
      );
      draw();
    }

    /** Hide (spec §3): each value becomes its Placeholder, typed in with the editor's own command. */
    async function hide(field: HTMLElement, targets: Underline[]) {
      // The user typed since the scan: a value that has moved is left for the next scan. Checked
      // before asking for Placeholders, so the Vault only gets values that are really hidden.
      const before = joined(piecesOf(field));
      const inPlace = targets.filter((u) => before.slice(u.start, u.end) === u.value);
      const items = inPlace.map(({ value, prefix }) => ({ value, prefix }));
      const placeholders: string[] = await browser.runtime.sendMessage({ type: 'placeholders', items, save: true });
      if (!Array.isArray(placeholders)) throw new Error('no Placeholders');
      const text = joined(piecesOf(field));
      // Last first, so each replacement leaves the offsets before it as they were.
      const order = inPlace.map((u, i) => ({ u, placeholder: placeholders[i] }));
      order.sort((a, b) => b.u.start - a.u.start);
      for (const { u, placeholder } of order) {
        if (!placeholder || text.slice(u.start, u.end) !== u.value) continue;
        replace(field, piecesOf(field), u.start, u.end, placeholder);
      }
      schedule(field, 0);
    }

    /** Ignore (spec §3): the pairs stop being underlined in this field, every occurrence. */
    function ignore(field: HTMLElement, targets: Underline[]) {
      const keys = ignored.get(field) ?? new Set();
      for (const { category, value } of targets) keys.add(ignoreKey(category, value));
      ignored.set(field, keys);
      underlined.set(field, (underlined.get(field) ?? []).filter((u) => !keys.has(ignoreKey(u.category, u.value))));
      draw();
    }

    /**
     * The underlined Finding under a point on screen, in any field. Only a field the point is
     * really over counts, so a Finding scrolled out of its field opens no Card over the page.
     */
    function underlineAt(x: number, y: number): Underline | undefined {
      const top = document.elementFromPoint(x, y);
      for (const [field, list] of underlined) {
        if (!top || !field.contains(top)) continue;
        for (const u of list) {
          for (const r of u.range.getClientRects()) {
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return u;
          }
        }
      }
      return undefined;
    }

    const ui = createUi();
    // The Finding whose Card is open, and whether a click keeps the Card open (spec §3, Card).
    let open: Underline | null = null;
    let pinned = false;
    let lingerTimer: ReturnType<typeof setTimeout> | undefined;
    // The sentence being rephrased from the open Card, and its rewrite once the Engine answers.
    // `id` tells a late answer for a Card that has since closed from the current one.
    let rephrasing: { id: number; field: HTMLElement; start: number; end: number; sentence: string; text?: string } | null =
      null;
    let rephraseCount = 0;

    const openCard = (u: Underline) => {
      clearTimeout(lingerTimer);
      const reopened = open && sameFinding(open, u);
      open = u;
      if (reopened) return;
      rephrasing = null; // another Finding's Card: a late rewrite must not land on it
      wake();
      ui.showCard(u);
      browser.runtime
        .sendMessage({ type: 'placeholders', items: [{ value: u.value, prefix: u.prefix }], save: false })
        .then(([placeholder]: string[]) => placeholder && open && sameFinding(open, u) && ui.stamp(placeholder))
        .catch(() => {});
    };
    const closeCard = () => {
      clearTimeout(lingerTimer);
      open = null;
      pinned = false;
      rephrasing = null;
      ui.hideCard();
    };

    /** Rephrase (spec §3): the sentence around the Finding goes to the Engine; the Card waits. */
    async function rephrase(u: Underline) {
      const text = joined(piecesOf(u.field));
      if (text.slice(u.start, u.end) !== u.value) return ui.showRephraseFailure('The text changed. Try again.');
      const { start, end } = sentenceAround(text, u.start, u.end);
      const id = ++rephraseCount;
      rephrasing = { id, field: u.field, start, end, sentence: text.slice(start, end) };
      pinned = true; // the answer may take seconds; the Card stays while the pointer moves
      ui.showRephrasing();
      const result: RephraseResult = await browser.runtime
        .sendMessage({ type: 'rephrase', sentence: rephrasing.sentence })
        .catch(() => ({ ok: false, reason: 'failed' }));
      if (rephrasing?.id !== id) return; // the Card closed while the Engine worked
      if (!result?.ok) return ui.showRephraseFailure(REPHRASE_FAILURES[result?.reason ?? 'failed']);
      rephrasing.text = result.text;
      ui.showPreview(result.text);
    }

    /** Accept replaces the sentence like typing, then scans once; nothing is rephrased again. */
    function accept() {
      if (!rephrasing?.text) return;
      const { field, start, end, sentence, text } = rephrasing;
      // The user typed since: the sentence has moved, so the rewrite can't go in its place.
      if (joined(piecesOf(field)).slice(start, end) !== sentence) {
        return ui.showRephraseFailure('The text changed. Try again.');
      }
      replace(field, piecesOf(field), start, end, text);
      closeCard();
      schedule(field, 0);
    }

    ui.onAction(async (action) => {
      if (action === 'rephrase') return open && rephrase(open);
      if (action === 'accept') return accept();
      if (action === 'reject') return closeCard();
      const all = current ? (underlined.get(current) ?? []) : [];
      try {
        if (action === 'hide' && open) await hide(open.field, [open]);
        if (action === 'hide-all' && current) await hide(current, all);
      } catch {
        // E.g. the extension was reloaded. The Card or menu stays, so the user knows nothing was hidden.
        return ui.showError();
      }
      if (action === 'ignore' && open) ignore(open.field, [open]);
      if (action === 'ignore-all' && current) ignore(current, all);
      closeCard();
      ui.closeMenu();
    });

    // Hovering a Finding opens its Card; leaving both closes it, unless a click pinned it.
    document.addEventListener(
      'mousemove',
      (e) => {
        if (pinned) return;
        // No Findings on the page (or the site is off): nothing to hover.
        if (!open && !hasFindings()) return;
        if (e.composedPath().includes(ui.host)) return clearTimeout(lingerTimer);
        const u = underlineAt(e.clientX, e.clientY);
        if (u) openCard(u);
        else if (open) {
          clearTimeout(lingerTimer);
          lingerTimer = setTimeout(closeCard, CARD_LINGER_MS);
        }
      },
      { passive: true },
    );
    document.addEventListener(
      'mousedown',
      (e) => {
        if (e.composedPath().includes(ui.host)) return;
        ui.closeMenu();
        const u = underlineAt(e.clientX, e.clientY);
        if (!u) return closeCard();
        openCard(u);
        pinned = true;
      },
      true,
    );
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Escape') return;
        closeCard();
        ui.closeMenu();
      },
      true,
    );

    // Each frame: keep the Card on its Finding and the Ghost bar on the current field.
    // A scan makes new Underlines: the open Card follows its Finding's new one, and closes only
    // when the Finding is gone.
    // The loop runs only while a Card or the Ghost bar is on screen; a scan or a Card wakes it.
    let placing = false;
    // The box the user sees around each field, found once (and again if the site rebuilds it).
    const boxes = new WeakMap<HTMLElement, HTMLElement>();
    const boxAround = (field: HTMLElement) => {
      let box = boxes.get(field);
      if (!box?.isConnected) boxes.set(field, (box = visibleBox(field)));
      return box;
    };
    const place = () => {
      if (open) {
        const was = open;
        const now = underlined.get(was.field)?.find((u) => sameFinding(u, was));
        if (now) open = now;
        else closeCard();
      }
      if (open) ui.placeCard(open.range.getBoundingClientRect());
      const count = current?.isConnected ? (underlined.get(current)?.length ?? 0) : 0;
      ui.placeBar(count, current && count ? boxAround(current) : null);
      // Nothing left on screen to keep in place: stop until something wakes the loop again.
      if (!open && !count) {
        placing = false;
        return;
      }
      requestAnimationFrame(place);
    };
    const wake = () => {
      if (placing) return;
      placing = true;
      requestAnimationFrame(place);
    };

    function hasFindings() {
      for (const list of underlined.values()) if (list.length) return true;
      return false;
    }

    function draw() {
      wake();
      for (const field of underlined.keys()) if (!field.isConnected) underlined.delete(field);
      const all = [...underlined.values()].flat();
      for (const colour of COLOURS) {
        const ranges = all.filter((u) => u.colour === colour).map((u) => u.range);
        CSS.highlights.set(`ghost-${colour}`, new Highlight(...ranges));
      }
    }

    document.addEventListener(
      'focusin',
      (e) => {
        const field = fieldOf(e.target);
        if (field) current = field;
        // The Ghost bar moves to this field, if it already has Findings.
        if (field) wake();
        watch(field);
      },
      true,
    );
    document.addEventListener('input', (e) => watch(fieldOf(e.target)), true);
    // Scan right after a paste, once the site has inserted it (its change would wait 1 s).
    document.addEventListener(
      'paste',
      (e) => {
        const field = fieldOf(e.target);
        watch(field);
        if (field) setTimeout(() => schedule(field, 0));
      },
      true,
    );
    // The user picked another Domain or changed its words: scan every field again.
    const rescanAll = () => {
      for (const field of underlined.keys()) schedule(field, 0);
    };
    selectedDomain.watch(rescanAll);
    customDomains.watch(rescanAll);
    // The toolbar ghost wears sunglasses on this tab while it checks the site: site on, Engine running.
    const showIcon = async () => {
      const on = siteOn && (await engineRunning.getValue());
      browser.runtime.sendMessage({ type: 'icon', on }).catch(() => {});
    };
    engineRunning.watch(showIcon);
    // The site was switched on or off: scan again, which draws or clears the underlines.
    const readSiteOn = async () => {
      siteOn = isSiteOn(location.hostname, await sites.getValue(), await pausedSites.getValue());
      rescanAll();
      showIcon();
    };
    sites.watch(readSiteOn);
    pausedSites.watch(readSiteOn);
    readSiteOn();
    // The page may have focused its input before this script loaded.
    current = fieldOf(document.activeElement);
    watch(current);
  },
});

function ignoreKey(category: string, value: string) {
  return `${category}\n${value}`;
}

/** Two Underlines of the same Finding, e.g. from two scans of an unchanged field. */
function sameFinding(a: Underline, b: Underline) {
  return a.field === b.field && a.start === b.start && a.end === b.end && a.value === b.value;
}

/** The Range of [start, end) in the field's joined text. */
function rangeOf(pieces: Piece<Text>[], start: number, end: number): Range | undefined {
  const a = pointAt(pieces, start, 'start');
  const b = pointAt(pieces, end, 'end');
  if (!a || !b) return undefined;
  const range = new Range();
  range.setStart(a.node, a.offset);
  range.setEnd(b.node, b.offset);
  return range;
}

/**
 * Replaces [start, end) of the field's text through the editor's own insert command, so the
 * site sees normal typing (spec §3, Hide) and Ctrl+Z undoes it.
 */
function replace(field: HTMLElement, pieces: Piece<Text>[], start: number, end: number, text: string) {
  field.focus();
  if (field instanceof HTMLTextAreaElement) {
    field.setSelectionRange(start, end);
  } else {
    const range = rangeOf(pieces, start, end);
    const selection = getSelection();
    if (!range || !selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }
  document.execCommand('insertText', false, text);
}

type Action = 'hide' | 'rephrase' | 'accept' | 'reject' | 'ignore' | 'hide-all' | 'ignore-all';

/**
 * The Card and the Ghost bar, in a Shadow DOM at the end of <body>, so the site's styles and
 * ours can't reach each other (spec §3, Card). Look: docs/design.md.
 */
function createUi() {
  const host = document.createElement('div');
  host.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
    <style>${tokens}${UI_STYLES}</style>
    <div class="card" role="dialog" aria-label="Finding" hidden>
      <div class="label">
        <span class="name"></span>
        <span class="value"></span>
        <span class="stamp" hidden></span>
      </div>
      <div class="tear"></div>
      <div class="rephrase" hidden>
        <p class="status" role="status"></p>
        <p class="preview" hidden></p>
        <div class="actions decide" hidden>
          <button type="button" class="primary" data-action="accept">Accept</button>
          <button type="button" class="text" data-action="reject">Reject</button>
        </div>
      </div>
      <div class="actions choices">
        <button type="button" class="primary" data-action="hide">Hide</button>
        <button type="button" class="secondary" data-action="rephrase">Rephrase</button>
        <button type="button" class="text" data-action="ignore">Ignore</button>
      </div>
      <p class="error" role="alert" hidden>Couldn't hide. Try again.</p>
    </div>
    <div class="bar" hidden>
      <div class="menu" role="menu" aria-label="Ghost bar" hidden>
        <button type="button" role="menuitem" data-action="hide-all">Hide all<span class="count"></span></button>
        <button type="button" role="menuitem" data-action="ignore-all">Ignore all<span class="count"></span></button>
        <p class="error" role="alert" hidden>Couldn't hide. Try again.</p>
      </div>
      <button type="button" class="tab" aria-expanded="false"><span class="count"></span>to check</button>
    </div>`;
  document.body.append(host);

  const $ = <E extends HTMLElement>(selector: string) => root.querySelector<E>(selector)!;
  const card = $('.card');
  const stamp = $('.stamp');
  const bar = $('.bar');
  const menu = $('.menu');
  const tab = $('.tab');
  const choices = $('.choices');
  const rephraseBox = $('.rephrase');
  const status = $('.status');
  const preview = $('.preview');
  const decide = $('.decide');
  const errors = root.querySelectorAll<HTMLElement>('.error');
  const showErrors = (show: boolean) => errors.forEach((e) => (e.hidden = !show));
  const setMenu = (isOpen: boolean) => {
    if (menu.hidden !== !isOpen) showErrors(false);
    menu.hidden = !isOpen;
    tab.setAttribute('aria-expanded', String(isOpen));
  };

  // Clicks on the Card keep the focus and selection in the site's editor.
  root.addEventListener('mousedown', (e) => e.preventDefault());
  tab.addEventListener('click', () => setMenu(menu.hidden));

  return {
    host,
    onAction(handler: (action: Action) => void) {
      root.addEventListener('click', (e) => {
        const button = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
        if (button) handler(button.dataset.action as Action);
      });
    },
    showCard(u: Underline) {
      card.style.setProperty('--cat', `var(--color-cat-${u.colour})`);
      $('.name').textContent = u.name;
      $('.value').textContent = u.value;
      stamp.hidden = true;
      showErrors(false);
      rephraseBox.hidden = true;
      choices.hidden = false;
      card.hidden = false;
    },
    /** Rephrasing: the buttons give way to the waiting line (docs/design.md, Card states). */
    showRephrasing() {
      showErrors(false);
      choices.hidden = true;
      rephraseBox.hidden = false;
      status.textContent = 'Rephrasing…';
      status.classList.remove('failed');
      status.hidden = false;
      preview.hidden = true;
      decide.hidden = true;
    },
    /** Preview: the new sentence, with Accept and Reject. */
    showPreview(text: string) {
      status.hidden = true;
      preview.textContent = text;
      preview.hidden = false;
      decide.hidden = false;
    },
    /** Why there is no rewrite. Hide, Rephrase and Ignore come back, so the user can go on. */
    showRephraseFailure(message: string) {
      rephraseBox.hidden = false;
      status.textContent = message;
      status.classList.add('failed');
      status.hidden = false;
      preview.hidden = true;
      decide.hidden = true;
      choices.hidden = false;
    },
    /** Under the Card's buttons and the menu's: only the one on screen is seen. */
    showError() {
      showErrors(true);
    },
    stamp(placeholder: string) {
      stamp.textContent = `hide as ${placeholder}`;
      stamp.hidden = false;
    },
    hideCard() {
      card.hidden = true;
    },
    /** Above the Finding, or below it when there is no room above. */
    placeCard(at: DOMRect) {
      const left = Math.min(Math.max(at.left, CARD_GAP_PX), innerWidth - CARD_WIDTH_PX - CARD_GAP_PX);
      const above = at.top - card.offsetHeight - CARD_GAP_PX;
      card.style.left = `${left}px`;
      card.style.top = `${above >= CARD_GAP_PX ? above : at.bottom + CARD_GAP_PX}px`;
    },
    /**
     * On top of the field's box, outside it, at its right, so it covers neither the text nor
     * the site's buttons; clear of a rounded corner. Gone at 0 (docs/design.md, Ghost bar).
     */
    placeBar(count: number, box: HTMLElement | null) {
      bar.hidden = !box;
      if (!box) return setMenu(false);
      for (const c of root.querySelectorAll('.count')) if (c.textContent !== String(count)) c.textContent = String(count);
      const rect = box.getBoundingClientRect();
      const corner = parseFloat(getComputedStyle(box).borderTopRightRadius) || 0;
      bar.style.right = `${innerWidth - rect.right + Math.max(CARD_GAP_PX, corner)}px`;
      bar.style.top = `${rect.top - tab.offsetHeight}px`;
    },
    closeMenu() {
      setMenu(false);
    },
  };
}

/** The Card and Ghost bar, from the canvas in docs/design.md. Colours and fonts come from tokens.css. */
const UI_STYLES = `
  [hidden] { display: none !important; }
  button { font: 500 var(--text-sm) var(--font-body); cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
  button:disabled { cursor: default; opacity: 0.5; }

  .card {
    position: fixed; z-index: 1; width: ${CARD_WIDTH_PX}px; box-sizing: border-box;
    display: flex; flex-direction: column;
    background: var(--color-paper-2); color: var(--color-ink); border-radius: var(--radius-card);
    box-shadow: var(--shadow-lift); font: 400 var(--text-sm) / 1.4 var(--font-body);
  }
  .label { position: relative; display: flex; flex-direction: column; gap: var(--space-xs); padding: 14px 16px 18px; }
  .name { font-size: 13px; text-decoration: underline wavy var(--cat) 1.5px; text-underline-offset: 4px; align-self: flex-start; }
  .value { font: 500 17px var(--font-outlier); overflow-wrap: anywhere; }
  /* A plaster stuck across the top-right corner: overhangs the edge, torn (dashed) ends. */
  .stamp {
    position: absolute; top: -6px; right: -12px; transform: rotate(8deg); padding: 5px 14px;
    border-block: 1px solid var(--color-stamp); border-inline: 1.5px dashed var(--color-stamp);
    border-radius: 2px; background: var(--color-stamp-soft); color: var(--color-stamp);
    box-shadow: var(--shadow-lift); font: 500 var(--text-xs) var(--font-outlier);
  }
  .tear { border-top: var(--rule-tear) dashed var(--color-rule); }
  .actions { display: flex; gap: 6px; padding: 14px 14px 16px; }
  .actions button { height: 38px; border-radius: var(--radius-control); transition: transform var(--dur-micro) var(--ease-out); }
  .actions button:active:not(:disabled) { transform: translateY(3px); }
  .primary { padding: 0 14px; border: 1px solid var(--color-accent-deep); background: var(--color-accent); color: var(--color-accent-ink); box-shadow: var(--shadow-mould); }
  .primary:active { box-shadow: none; }
  .secondary { padding: 0 12px; border: 1px solid var(--color-rule); background: var(--color-paper-2); color: var(--color-ink); box-shadow: var(--shadow-mould-clear); }
  .text { padding: 0 6px; border: 0; background: transparent; color: var(--color-muted); }
  .text:hover { color: var(--color-ink); }
  .rephrase { display: flex; flex-direction: column; gap: var(--space-xs); padding: 14px 16px 0; }
  .rephrase .actions { padding: 6px 0 16px; }
  .status { margin: 0; color: var(--color-muted); }
  .status.failed { color: var(--color-cat-id-ink); font-size: var(--text-xs); }
  .preview {
    margin: 0; padding: 10px 12px; border-radius: var(--radius-control);
    background: var(--color-paper-3); overflow-wrap: anywhere;
  }
  .error { margin: 0; padding: 0 16px 14px; color: var(--color-cat-id-ink); font-size: var(--text-xs); }
  .menu .error { padding: 4px 10px; }

  .bar { position: fixed; display: flex; flex-direction: column; align-items: flex-end; font-family: var(--font-body); }
  .tab {
    height: 30px; display: flex; align-items: center; gap: 6px; padding: 0 10px;
    border: 1px solid var(--color-rule-2); border-bottom: 0; border-left: 1.5px dashed var(--color-stamp);
    border-radius: 8px 8px 0 0; background: var(--color-paper-2); color: var(--color-ink); font-size: 13px;
  }
  .tab .count { font-family: var(--font-outlier); color: var(--color-stamp); }
  .tab[aria-expanded="true"] { border: 1px solid var(--color-accent-deep); border-bottom: 0; background: var(--color-accent); color: var(--color-accent-ink); }
  .tab[aria-expanded="true"] .count { color: inherit; }
  .menu {
    position: absolute; bottom: calc(100% + 6px); right: 0; min-width: 180px;
    display: flex; flex-direction: column; gap: 2px; padding: 6px;
    background: var(--color-paper-2); border-radius: var(--radius-card); box-shadow: var(--shadow-lift);
  }
  .menu button {
    height: 36px; display: flex; align-items: center; justify-content: space-between; gap: var(--space-md);
    padding: 0 10px; border: 0; border-radius: 6px; background: transparent; color: var(--color-ink);
  }
  .menu button:hover, .menu button:focus-visible { background: var(--color-paper-3); }
  .menu .count { font-family: var(--font-outlier); color: var(--color-stamp); }

  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

/** The input field around `target`: a <textarea>, or the outermost contenteditable element. */
function fieldOf(target: EventTarget | null): HTMLElement | null {
  if (target instanceof HTMLTextAreaElement) return target;
  if (!(target instanceof HTMLElement) || !target.isContentEditable) return null;
  let root = target;
  while (root.parentElement?.isContentEditable) root = root.parentElement;
  return root;
}

/**
 * The box the user sees around a field: the field itself, or its nearest parent with a
 * background, border or shadow. In ChatGPT the field is only the text; the rounded box is a parent.
 */
function visibleBox(field: HTMLElement): HTMLElement {
  for (let el: HTMLElement | null = field; el && el !== document.body; el = el.parentElement) {
    const style = getComputedStyle(el);
    const background = style.backgroundColor !== 'transparent' && style.backgroundColor !== 'rgba(0, 0, 0, 0)';
    if (background || parseFloat(style.borderTopWidth) > 0 || style.boxShadow !== 'none') return el;
  }
  return field;
}

/** The field's text nodes in order, with a line break between paragraphs and at each <br>. */
function readField(field: HTMLElement): Piece<Text>[] {
  const pieces: Piece<Text>[] = [];
  const lineBreak = { node: null, text: '\n' };
  const atLineStart = () => pieces.at(-1)?.text.endsWith('\n') ?? true;
  const walker = document.createTreeWalker(field, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Text) pieces.push({ node, text: node.data });
    else if (node.nodeName === 'BR') pieces.push(lineBreak);
    else if (BLOCKS.has(node.nodeName) && !atLineStart()) pieces.push(lineBreak);
  }
  return pieces;
}

function joined(pieces: Piece<Text>[]): string {
  return pieces.map((p) => p.text).join('');
}

/** A transparent box at the end of <body>, outside the site's editor; clicks pass through it. */
function createOverlay(): Overlay {
  const box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  const text = document.createTextNode('');
  // A textarea shows a line after a final line break; a div needs one more character for it.
  box.append(text, '​');
  Object.assign(box.style, {
    position: 'fixed',
    margin: '0',
    boxSizing: 'border-box',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    color: 'transparent',
    background: 'transparent',
    borderColor: 'transparent',
    pointerEvents: 'none',
    zIndex: '2147483646',
  });
  document.body.append(box);
  return { box, text };
}

/** Puts the overlay exactly over the textarea, with the same text layout and scroll. */
function placeOverlay(field: HTMLTextAreaElement, { box }: Overlay) {
  const rect = field.getBoundingClientRect();
  const style = getComputedStyle(field);
  for (const name of COPIED_STYLES) box.style[name] = style[name];
  // A scrollbar narrows the textarea's text; the overlay has none, so it gets that much padding.
  const borders = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
  const scrollbar = field.offsetWidth - field.clientWidth - borders;
  box.style.paddingRight = `${parseFloat(style.paddingRight) + scrollbar}px`;
  // The wavy line hangs below the last line; extra room at the bottom keeps it from being cut.
  box.style.paddingBottom = `${parseFloat(style.paddingBottom) + UNDERLINE_ROOM_PX}px`;
  Object.assign(box.style, {
    display: rect.width ? 'block' : 'none',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height + UNDERLINE_ROOM_PX}px`,
  });
  box.scrollTop = field.scrollTop;
  box.scrollLeft = field.scrollLeft;
}

/**
 * Wavy underlines in the page itself, since highlights live in the page, not in a Shadow DOM.
 * Colours are copied from tokens.css as values, so its variables never touch the site's :root.
 */
function addUnderlineStyles() {
  const token = (name: string) => tokens.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1];
  const style = document.createElement('style');
  style.textContent = COLOURS.map(
    (colour) =>
      `::highlight(ghost-${colour}) { text-decoration: underline wavy ${token(`--color-cat-${colour}`)} 1.5px; text-underline-offset: 4px; }`,
  ).join('\n');
  document.head.append(style);
}
