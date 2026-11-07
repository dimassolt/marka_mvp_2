import tokens from '@/assets/tokens.css?raw';
import { engineRunning, type Finding } from '@/utils/engine-status';
import { customDomains, isSiteOn, pausedSites, selectedDomain, sites } from '@/utils/popup-settings';
import { colourOf, pointAt, type Colour, type Piece } from '@/utils/underlines';

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

    // Any change in the field, however the site makes it, schedules a scan.
    const watch = (field: HTMLElement | null) => {
      if (!field || watched.has(field)) return;
      watched.add(field);
      if (field instanceof HTMLTextAreaElement) {
        const overlay = createOverlay();
        overlays.set(field, overlay);
        follow(field, overlay);
      } else {
        new MutationObserver(() => schedule(field, TYPING_PAUSE_MS)).observe(field, {
          subtree: true,
          childList: true,
          characterData: true,
        });
      }
      schedule(field, 0);
    };

    // Each frame: keep the overlay on the textarea, and notice new text. A site can change
    // a textarea's value without any event (e.g. emptying it after Send).
    const follow = (field: HTMLTextAreaElement, overlay: Overlay) => {
      if (!field.isConnected) {
        overlay.box.remove();
        underlined.delete(field);
        draw();
        return;
      }
      placeOverlay(field, overlay);
      if (overlay.text.data !== field.value) {
        overlay.text.data = field.value;
        schedule(field, TYPING_PAUSE_MS);
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
      // An empty field means the message was sent: its values are flagged again.
      if (!text.trim()) ignored.delete(field);

      underlined.set(
        field,
        findings.flatMap(({ start, end, category, prefix, name, group }) => {
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
      const items = targets.map(({ value, prefix }) => ({ value, prefix }));
      const placeholders: string[] = await browser.runtime.sendMessage({ type: 'placeholders', items, save: true });
      const text = joined(piecesOf(field));
      // Last first, so each replacement leaves the offsets before it as they were.
      const order = targets.map((u, i) => ({ u, placeholder: placeholders[i] }));
      order.sort((a, b) => b.u.start - a.u.start);
      for (const { u, placeholder } of order) {
        // The user typed since the scan: this value has moved, so leave it for the next scan.
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

    /** The underlined Finding under a point on screen, in any field. */
    function underlineAt(x: number, y: number): Underline | undefined {
      for (const list of underlined.values()) {
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

    const openCard = (u: Underline) => {
      clearTimeout(lingerTimer);
      if (open === u) return;
      open = u;
      ui.showCard(u);
      browser.runtime
        .sendMessage({ type: 'placeholders', items: [{ value: u.value, prefix: u.prefix }], save: false })
        .then(([placeholder]: string[]) => placeholder && open === u && ui.stamp(placeholder))
        .catch(() => {});
    };
    const closeCard = () => {
      clearTimeout(lingerTimer);
      open = null;
      pinned = false;
      ui.hideCard();
    };

    ui.onAction((action) => {
      if (action === 'hide' && open) hide(open.field, [open]);
      if (action === 'ignore' && open) ignore(open.field, [open]);
      const all = current ? (underlined.get(current) ?? []) : [];
      if (action === 'hide-all' && current) hide(current, all);
      if (action === 'ignore-all' && current) ignore(current, all);
      closeCard();
      ui.closeMenu();
    });

    // Hovering a Finding opens its Card; leaving both closes it, unless a click pinned it.
    document.addEventListener(
      'mousemove',
      (e) => {
        if (pinned) return;
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
    const place = () => {
      const all = [...underlined.values()].flat();
      if (open && !all.includes(open)) closeCard();
      if (open) ui.placeCard(open.range.getBoundingClientRect());
      const count = current?.isConnected ? (underlined.get(current)?.length ?? 0) : 0;
      ui.placeBar(count, current && count ? current.getBoundingClientRect() : null);
      requestAnimationFrame(place);
    };
    requestAnimationFrame(place);

    function draw() {
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

type Action = 'hide' | 'ignore' | 'hide-all' | 'ignore-all';

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
      <div class="actions">
        <button type="button" class="primary" data-action="hide">Hide</button>
        <button type="button" class="secondary" disabled title="Coming soon">Rephrase</button>
        <button type="button" class="text" data-action="ignore">Ignore</button>
      </div>
    </div>
    <div class="bar" hidden>
      <div class="menu" role="menu" aria-label="Ghost bar" hidden>
        <button type="button" role="menuitem" data-action="hide-all">Hide all<span class="count"></span></button>
        <button type="button" role="menuitem" data-action="ignore-all">Ignore all<span class="count"></span></button>
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
  const setMenu = (isOpen: boolean) => {
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
      card.hidden = false;
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
    /** On the field's bottom edge, at its right; gone at 0 (docs/design.md, Ghost bar). */
    placeBar(count: number, field: DOMRect | null) {
      bar.hidden = !field;
      if (!field) return setMenu(false);
      for (const c of root.querySelectorAll('.count')) if (c.textContent !== String(count)) c.textContent = String(count);
      bar.style.right = `${innerWidth - field.right + CARD_GAP_PX}px`;
      bar.style.top = `${field.bottom - tab.offsetHeight}px`;
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
    position: fixed; width: ${CARD_WIDTH_PX}px; box-sizing: border-box;
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
