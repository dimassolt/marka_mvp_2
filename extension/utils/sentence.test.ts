import { describe, expect, it } from 'vitest';
import { fitRewrite, MAX_SENTENCE, sentenceAround } from './sentence';

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

// The note from the fix/rephrase bug report: one run-on sentence of 1067 characters, with
// commas but no full stop until the end. The Engine refuses more than 1000 (422).
const RUN_ON =
  'Pasienten Kari Nordmann, fnr 01019000083, er 34 år, jobber som lærer ved Sandvika ungdomsskole ' +
  'og bor sammen med mannen sin Ola Nordmann i Sandvika, hun fikk diagnosen diabetes type 1 som ' +
  'tenåring og bruker insulin hver dag, men de siste månedene har blodsukkeret vært ustabilt, og hun ' +
  'har vært innlagt på Bærum sykehus to ganger etter føling på jobb, fastlegen hennes, dr Anne Hansen ' +
  'ved Sandvika legesenter, har sykemeldt henne i fire uker og henvist henne videre til endokrinolog, ' +
  'i tillegg sliter hun med angst og søvnproblemer etter innleggelsene, og hun tar nå sertralin i ' +
  'tillegg til insulinbehandlingen, arbeidsgiveren hennes har bedt om en vurdering av tilrettelegging, ' +
  'og hun ønsker hjelp til å skrive et brev til rektor der hun forklarer situasjonen uten å dele mer ' +
  'enn nødvendig, du kan ringe henne på +47 912 34 567 hvis noe er uklart, hun har også gitt beskjed ' +
  'om at moren hennes, [PERSON_1], kan kontaktes på [PHONE_1] dersom hun selv ikke svarer, og at hun ' +
  'helst vil ha svar før fredag fordi neste time hos endokrinologen er satt opp på mandag morgen.';

describe('sentenceAround in a run-on sentence (fix/rephrase)', () => {
  it('cuts at the commas around the Finding, adding clauses on each side while they fit', () => {
    expect(around(RUN_ON, 'Ola Nordmann')).toBe(
      'Pasienten Kari Nordmann, fnr 01019000083, er 34 år, jobber som lærer ved Sandvika ungdomsskole ' +
        'og bor sammen med mannen sin Ola Nordmann i Sandvika, hun fikk diagnosen diabetes type 1 som ' +
        'tenåring og bruker insulin hver dag, men de siste månedene har blodsukkeret vært ustabilt',
    );
  });

  it('never sends more than MAX_SENTENCE: one long clause is cut at the spaces around the Finding', () => {
    const words = 'og så videre '.repeat(40);
    const text = `${words}Kari har diabetes ${words}`;
    const span = around(text, 'diabetes');
    expect(span.length).toBeLessThanOrEqual(MAX_SENTENCE);
    expect(span).toContain('Kari har diabetes');
    expect(text).toMatch(new RegExp(`(^| )${span}( |$)`));
  });

  it('does not split a number at its decimal comma', () => {
    const text = `${'Klassen jobbet godt i år, '.repeat(12)}snittet i 10A var 4,1 og Ola fikk 2`;
    expect(around(text, 'Ola')).toMatch(/var 4,1 og Ola fikk 2$/);
  });
});

describe('fitRewrite: a rewrite of a clause goes back mid-sentence (fix/rephrase)', () => {
  it('drops the full stop and the capital the model adds to a clause', () => {
    expect(fitRewrite('hun fikk diagnosen diabetes type 1', 'Hun fikk en helseutfordring.')).toBe(
      'hun fikk en helseutfordring',
    );
  });

  it('leaves a rewrite of a whole sentence as it is', () => {
    expect(fitRewrite('Kari har diabetes.', 'En kvinne har en helseutfordring.')).toBe(
      'En kvinne har en helseutfordring.',
    );
  });

  it('keeps a capital that starts a name, a placeholder or an acronym', () => {
    expect(fitRewrite('fnr 01019000083', '[FNR_1]')).toBe('[FNR_1]');
    expect(fitRewrite('jobber ved NAV i Bærum', 'NAV på Østlandet.')).toBe('NAV på Østlandet');
  });
});

