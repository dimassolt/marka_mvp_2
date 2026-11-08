/** Underline colours, named after the tokens in assets/tokens.css (`--color-cat-<colour>`). */
export type Colour = 'id' | 'contact' | 'domain';

/**
 * One piece of a field's text, in order: a text node's data, or a line break (`node: null`)
 * that the Extension adds between paragraphs. Joined, the pieces are the text sent to /detect.
 */
export interface Piece<N> {
  node: N | null;
  text: string;
}

/**
 * The text node and offset inside it for a position in the joined text.
 * A Finding's `start` belongs to the node after a boundary, its `end` to the node before.
 */
export function pointAt<N>(pieces: Piece<N>[], offset: number, edge: 'start' | 'end') {
  let pieceStart = 0;
  for (const { node, text } of pieces) {
    const pieceEnd = pieceStart + text.length;
    const inside = edge === 'start' ? offset < pieceEnd : offset <= pieceEnd;
    if (node !== null && inside) return { node, offset: Math.max(0, offset - pieceStart) };
    pieceStart = pieceEnd;
  }
  return undefined;
}

/** Where the Finding at [start, end) of `before` starts in `after`. */
export function movedStart(before: string, after: string, start: number, end: number): number | undefined {
  if (after.startsWith(before.slice(0, end))) return start;
  if (after.endsWith(before.slice(start))) return start + after.length - before.length;
  return undefined;
}

/** The underline colour of a Finding's group, as the Engine sends it (docs/spec.md §1). Unknown groups are teal. */
export function colourOf(group?: string): Colour {
  return group === 'id' || group === 'contact' ? group : 'domain';
}
