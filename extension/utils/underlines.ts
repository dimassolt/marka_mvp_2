/** Underline colours, named after the tokens in assets/tokens.css (`--color-cat-<colour>`). */
export type Colour = 'id' | 'contact' | 'domain';

const ID = ['fodselsnummer', 'd_nummer', 'bank_account', 'payment_card', 'iban', 'secret', 'password'];
const CONTACT = ['email', 'phone', 'person_name'];

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

/** The underline colour of a Category (docs/spec.md §1). Domain words, own words and unknown ids are teal. */
export function colourOf(category: string): Colour {
  if (ID.includes(category)) return 'id';
  if (CONTACT.includes(category)) return 'contact';
  return 'domain';
}
