import type { Finding } from './engine-status';
import { sites } from './popup-settings';
import { colourOf, type Colour } from './underlines';

/** A piece of the practice text: plain, or a Finding with its underline colour. */
export type TextPiece = { text: string } | { text: string; category: string; colour: Colour };

/** Splits text at its Findings (sorted, never overlapping, as /detect returns them). */
export function splitByFindings(text: string, findings: Finding[]): TextPiece[] {
  const pieces: TextPiece[] = [];
  let last = 0;
  for (const { start, end, category } of findings) {
    if (start > last) pieces.push({ text: text.slice(last, start) });
    pieces.push({ text: text.slice(start, end), category, colour: colourOf(category) });
    last = end;
  }
  if (last < text.length) pieces.push({ text: text.slice(last) });
  return pieces;
}

/** Placeholder prefix per Category (docs/spec.md §1); DATA for any other. */
const PREFIXES: Record<string, string> = {
  fodselsnummer: 'FNR',
  d_nummer: 'DNR',
  bank_account: 'ACCOUNT',
  payment_card: 'CARD',
  iban: 'IBAN',
  secret: 'SECRET',
  password: 'PASSWORD',
  email: 'EMAIL',
  phone: 'PHONE',
  person_name: 'PERSON',
  health: 'HEALTH',
  education: 'EDUCATION',
  courts: 'COURTS',
  industrial: 'INDUSTRIAL',
  religious: 'RELIGIOUS',
};

/** The Placeholder each value would get on Hide: numbered per prefix, the same value the same one. */
export function placeholdersFor(values: { value: string; category: string }[]): string[] {
  const given = new Map<string, string>();
  const counts = new Map<string, number>();
  return values.map(({ value, category }) => {
    const prefix = PREFIXES[category] ?? 'DATA';
    const key = `${prefix}\u0000${value}`;
    if (!given.has(key)) {
      const n = (counts.get(prefix) ?? 0) + 1;
      counts.set(prefix, n);
      given.set(key, `[${prefix}_${n}]`);
    }
    return given.get(key)!;
  });
}

/** The practice text, a short version of the demo note (docs/spec.md §5). */
export const SAMPLE_TEXT =
  'Pasienten heter Kari, fnr 01019000083, og har diabetes. Ring henne på +47 912 34 567.';

/** What the Engine finds in SAMPLE_TEXT with the Health Domain; shown while it isn't running. */
export const SAMPLE_FINDINGS: Finding[] = (
  [
    ['Kari', 'person_name', 0.6],
    ['01019000083', 'fodselsnummer', 0.99],
    ['diabetes', 'health', 0.8],
    ['+47 912 34 567', 'phone', 0.9],
  ] as const
).map(([value, category, confidence]) => {
  const start = SAMPLE_TEXT.indexOf(value);
  return { start, end: start + value.length, category, confidence };
});

/** How the onboarding presents a built-in Domain. */
export type DomainCard = { title: string; about: string; example?: string };

/** Copy per built-in Domain; examples come from each keyword list (docs/spec.md §1). */
const DOMAIN_CARDS: Record<string, DomainCard> = {
  free: { title: 'Free', about: 'The Base checks only. Good for everyday chats.' },
  health: {
    title: 'Health',
    about:
      'Adds health words in Bokmål and English: diagnoses, medicines and terms like innlagt and sykemeldt.',
    example: 'diabetes · sykemeldt · insulin',
  },
  education: {
    title: 'Education',
    about: 'Adds student words: special needs, absence, discipline and grades.',
    example: 'IOP · fravær · spesialundervisning',
  },
  courts: {
    title: 'Courts',
    about: 'Adds court words: closed hearings, draft decisions and sensitive case types.',
    example: 'lukkede dører · barnevern',
  },
  industrial: {
    title: 'Industrial',
    about: 'Adds plant words: machine makers, machine park, lines and capacity.',
    example: 'Fanuc · produksjonslinje',
  },
  religious: {
    title: 'Religious',
    about: 'Adds parish words: membership, pastoral care and ceremonies.',
    example: 'menighet · sjelesorg',
  },
};

/** The card for a built-in Domain. One added later without copy here is shown by its name. */
export function domainCard(domain: string): DomainCard {
  const known = DOMAIN_CARDS[domain];
  if (known) return known;
  const words = domain.replace(/[_-]+/g, ' ');
  const title = words.charAt(0).toUpperCase() + words.slice(1);
  return { title, about: `Adds the ${title} word list, plus the Base checks.` };
}

/** Built-in Domains shown as cards; the rest go in a compact list, so the page stays small. */
const FEATURED = ['free', 'health', 'education'];

export function featuredDomains(all: readonly string[]): { cards: string[]; more: string[] } {
  return {
    cards: all.filter((d) => FEATURED.includes(d)),
    more: all.filter((d) => !FEATURED.includes(d)),
  };
}

/** Suggested when the user wants Ghost Agent on chosen sites only. */
export const AI_CHAT_SITES = ['chatgpt.com', 'claude.ai', 'gemini.google.com'];

/** Check every site (`*`). Sites the user chose stay listed, for when they switch back. */
export async function checkEverywhere(): Promise<void> {
  const list = await sites.getValue();
  if (!list.includes('*')) await sites.setValue(['*', ...list]);
}

/** Check only listed sites. With none listed yet, start from the common AI chats. */
export async function checkOnlyChosenSites(): Promise<void> {
  const chosen = (await sites.getValue()).filter((s) => s !== '*');
  await sites.setValue(chosen.length > 0 ? chosen : AI_CHAT_SITES);
}

/** Whether the user has finished (or skipped) onboarding. */
export const onboardingDone = storage.defineItem<boolean>('local:onboardingDone', {
  fallback: false,
});

/** Opens onboarding in a new tab on a fresh install only, never on an update. */
export async function openOnboardingOnInstall({ reason }: { reason: string }): Promise<void> {
  if (reason !== 'install' || (await onboardingDone.getValue())) return;
  await openOnboarding();
}

/** Opens the onboarding page in a new tab; the popup offers it again from Settings. */
export async function openOnboarding(): Promise<void> {
  await browser.tabs.create({ url: browser.runtime.getURL('/onboarding.html') });
}
