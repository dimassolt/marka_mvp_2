import { describe, expect, it } from 'vitest';
import { colourOf, pointAt, type Piece } from './underlines';

describe('pointAt', () => {
  // <p>Hei <b>Kari</b></p><p>fnr 01019000083</p> → "Hei Kari\nfnr 01019000083"
  const pieces: Piece<string>[] = [
    { node: 'A', text: 'Hei ' },
    { node: 'B', text: 'Kari' },
    { node: null, text: '\n' },
    { node: 'C', text: 'fnr 01019000083' },
  ];

  it('finds a Finding inside one text node', () => {
    expect(pointAt(pieces, 4, 'start')).toEqual({ node: 'B', offset: 0 });
    expect(pointAt(pieces, 8, 'end')).toEqual({ node: 'B', offset: 4 });
  });

  it('counts the line break between paragraphs', () => {
    expect(pointAt(pieces, 13, 'start')).toEqual({ node: 'C', offset: 4 });
    expect(pointAt(pieces, 24, 'end')).toEqual({ node: 'C', offset: 15 });
  });

  it('starts a Finding at the start of the next node, not the end of the previous one', () => {
    expect(pointAt(pieces, 4, 'start')?.node).toBe('B');
  });

  it('moves a start on a line break to the next text node', () => {
    expect(pointAt(pieces, 8, 'start')).toEqual({ node: 'C', offset: 0 });
  });

  it('finds nothing past the end of the text', () => {
    expect(pointAt(pieces, 99, 'end')).toBeUndefined();
  });
});

describe('colourOf', () => {
  it.each(['id', 'contact', 'domain'])('draws the group %s in its own colour', (group) =>
    expect(colourOf(group)).toBe(group),
  );

  it('draws a group it does not know teal', () => {
    expect(colourOf('something_new')).toBe('domain');
  });
});
