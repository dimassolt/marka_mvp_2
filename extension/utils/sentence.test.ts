import { describe, expect, it } from 'vitest';
import { sentenceAround } from './sentence';

// docs/spec.md §5
const NOTE =
  'Hei! Kan du hjelpe meg å skrive et henvisningsbrev? Pasienten heter Kari Nordmann, ' +
  'fnr 01019000083. Kari, 34 år, jobber som lærer i Bærum og har diabetes type 1. ' +
  'Hun er sykemeldt og bruker insulin. Ring henne på +47 912 34 567 eller send e-post ' +
  'til kari.nordmann@example.com.';

/** The sentence around the first occurrence of `value` in `text`. */
function around(text: string, value: string) {
  const start = text.indexOf(value);
  const { start: s, end: e } = sentenceAround(text, start, start + value.length);
  return text.slice(s, e);
}

describe('sentenceAround (docs/spec.md §3, Rephrase)', () => {
  it('reaches the full stop on each side', () => {
    expect(around(NOTE, 'diabetes')).toBe('Kari, 34 år, jobber som lærer i Bærum og har diabetes type 1.');
  });

  it('stops at a question mark before the Finding', () => {
    expect(around(NOTE, '01019000083')).toBe('Pasienten heter Kari Nordmann, fnr 01019000083.');
  });

  it('keeps the full stops inside the Finding itself', () => {
    expect(around(NOTE, 'kari.nordmann@example.com')).toBe(
      'Ring henne på +47 912 34 567 eller send e-post til kari.nordmann@example.com.',
    );
  });

  it('stops at line breaks, which are not part of the sentence', () => {
    expect(around('Hei\nKari har diabetes\nHilsen Ola', 'diabetes')).toBe('Kari har diabetes');
  });

  it('runs to the ends of the text without punctuation', () => {
    expect(around('Kari har diabetes', 'Kari')).toBe('Kari har diabetes');
  });

  it('stops at an exclamation mark after the Finding', () => {
    expect(around('Kari har diabetes! Hjelp meg.', 'diabetes')).toBe('Kari har diabetes!');
  });
});
