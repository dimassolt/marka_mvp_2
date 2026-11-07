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

/** An invisible copy of a <textarea>'s text laid over it: highlights can't reach inside a textarea. */
interface Overlay {
  box: HTMLDivElement;
  text: Text;
}

export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    addUnderlineStyles();

    const underlined = new Map<HTMLElement, { colour: Colour; range: Range }[]>();
    const watched = new WeakSet<HTMLElement>();
    const overlays = new WeakMap<HTMLTextAreaElement, Overlay>();
    const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
    // Off until the site settings are read, so no text reaches the Engine on a site switched off.
    let siteOn = false;

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

      underlined.set(
        field,
        findings.flatMap((finding) => {
          const start = pointAt(pieces, finding.start, 'start');
          const end = pointAt(pieces, finding.end, 'end');
          if (!start || !end) return [];
          const range = new Range();
          range.setStart(start.node, start.offset);
          range.setEnd(end.node, end.offset);
          return [{ colour: colourOf(finding.category), range }];
        }),
      );
      draw();
    }

    function draw() {
      for (const field of underlined.keys()) if (!field.isConnected) underlined.delete(field);
      const all = [...underlined.values()].flat();
      for (const colour of COLOURS) {
        const ranges = all.filter((u) => u.colour === colour).map((u) => u.range);
        CSS.highlights.set(`ghost-${colour}`, new Highlight(...ranges));
      }
    }

    document.addEventListener('focusin', (e) => watch(fieldOf(e.target)), true);
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
    watch(fieldOf(document.activeElement));
  },
});

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
