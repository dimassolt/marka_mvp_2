/** Characters that end a sentence. A line break ends one too, but is not part of it. */
const ENDS = '.!?';

const isMark = (ch: string | undefined) => ch !== undefined && ENDS.includes(ch);
const isBoundary = (ch: string | undefined) => isMark(ch) || ch === '\n';
const isSpace = (ch: string | undefined) => ch !== undefined && /\s/.test(ch);

/**
 * The longest text the Extension sends to POST /rephrase. The Engine takes up to 1000
 * characters, but a 2B model rewrites a short span faster and better, and its answer is
 * capped at 256 tokens (docs/spec.md §3, Rephrase).
 */
export const MAX_SENTENCE = 300;

type Span = { start: number; end: number };

/** A clause ends at `,` or `;` followed by a space, so "4,1" stays one number. */
const CLAUSE_END = /[,;]\s+/g;

/**
 * The sentence around a Finding (docs/spec.md §3, Rephrase): the text up to the nearest
 * `.`, `!`, `?` or line break on each side, with the closing mark and without the spaces
 * around it. Marks inside the Finding itself (an email's dots) don't count.
 * A sentence longer than `max` is cut to the clauses around the Finding (see clausesAround).
 */
export function sentenceAround(
  text: string,
  start: number,
  end: number,
  max = MAX_SENTENCE,
): Span {
  let from = start;
  while (from > 0 && !isBoundary(text[from - 1])) from--;
  let to = end;
  while (to < text.length && !isBoundary(text[to])) to++;
  if (isMark(text[to])) to++;
  while (from < start && isSpace(text[from])) from++;
  while (to > end && isSpace(text[to - 1])) to--;
  if (to - from <= max) return { start: from, end: to };
  return clausesAround(text, from, to, start, end, max);
}

/**
 * Inside the sentence [from, to): the clause that holds the Finding, then the next clause on
 * the left and on the right in turn, while the whole still fits in `max`. Separators inside
 * the Finding don't count. One clause longer than `max` is cut to whole words (wordsAround).
 */
function clausesAround(text: string, from: number, to: number, start: number, end: number, max: number): Span {
  const clauses: Span[] = [];
  let clauseStart = from;
  for (const match of text.slice(from, to).matchAll(CLAUSE_END)) {
    const at = from + match.index;
    if (at >= start && at < end) continue;
    clauses.push({ start: clauseStart, end: at });
    clauseStart = at + match[0].length;
  }
  clauses.push({ start: clauseStart, end: to });

  // The Finding starts in the first clause that ends after its start, and ends in `last`.
  let first = clauses.findIndex((c) => c.end > start);
  if (first < 0) first = clauses.length - 1;
  let last = first;
  while (last < clauses.length - 1 && clauses[last]!.end < end) last++;

  let span = { start: clauses[first]!.start, end: clauses[last]!.end };
  for (let grew = true; grew; ) {
    grew = false;
    const left = clauses[first - 1];
    if (left && span.end - left.start <= max) {
      first--;
      span = { start: left.start, end: span.end };
      grew = true;
    }
    const right = clauses[last + 1];
    if (right && right.end - span.start <= max) {
      last++;
      span = { start: span.start, end: right.end };
      grew = true;
    }
  }
  return span.end - span.start <= max ? span : wordsAround(text, span, start, end, max);
}

/** Whole words on each side of the Finding, in turn, inside `within`. */
function wordsAround(text: string, within: Span, start: number, end: number, max: number): Span {
  let left = start;
  let right = end;
  for (let grew = true; grew; ) {
    grew = false;
    // The start of the word before `left`, and the end of the word after `right`.
    const before = Math.max(within.start, text.lastIndexOf(' ', left - 2) + 1);
    if (before < left && right - before <= max) {
      left = before;
      grew = true;
    }
    const space = text.indexOf(' ', right + 1);
    const after = space < 0 || space > within.end ? within.end : space;
    if (after > right && after - left <= max) {
      right = after;
      grew = true;
    }
  }
  return { start: left, end: right };
}

/**
 * A rewrite of a span that sat inside a sentence, made to fit back in its place: the model
 * writes every answer as a sentence, so a clause comes back with a capital and a full stop.
 * The capital goes only when the span began in lower case and the word is not all capitals.
 */
export function fitRewrite(span: string, rewrite: string): string {
  let text = rewrite;
  if (!isMark(span.at(-1)) && isMark(text.at(-1))) text = text.slice(0, -1).trimEnd();
  const lower = (ch: string | undefined) => ch !== undefined && ch !== ch.toUpperCase();
  if (lower(span[0]) && !lower(text[0]) && lower(text[1])) text = text.charAt(0).toLowerCase() + text.slice(1);
  return text;
}
