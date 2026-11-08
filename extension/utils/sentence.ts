/** Characters that end a sentence. A line break ends one too, but is not part of it. */
const ENDS = '.!?';

const isMark = (ch: string | undefined) => ch !== undefined && ENDS.includes(ch);
const isBoundary = (ch: string | undefined) => isMark(ch) || ch === '\n';
const isSpace = (ch: string | undefined) => ch !== undefined && /\s/.test(ch);

/**
 * The sentence around a Finding (docs/spec.md §3, Rephrase): the text up to the nearest
 * `.`, `!`, `?` or line break on each side, with the closing mark and without the spaces
 * around it. Marks inside the Finding itself (an email's dots) don't count.
 */
export function sentenceAround(text: string, start: number, end: number): { start: number; end: number } {
  let from = start;
  while (from > 0 && !isBoundary(text[from - 1])) from--;
  let to = end;
  while (to < text.length && !isBoundary(text[to])) to++;
  if (isMark(text[to])) to++;
  while (from < start && isSpace(text[from])) from++;
  while (to > end && isSpace(text[to - 1])) to--;
  return { start: from, end: to };
}
