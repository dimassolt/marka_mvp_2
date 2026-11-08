import type { Finding } from './engine-status';
import { sites } from './popup-settings';
import { colourOf, type Colour } from './underlines';
import { remember, type Vault } from './vault';

/** A piece of the practice text: plain, or a Finding with its underline colour. */
export type TextPiece = { text: string } | { text: string; category: string; colour: Colour };

/** Splits text at its Findings (sorted, never overlapping, as /detect returns them). */
export function splitByFindings(text: string, findings: Finding[]): TextPiece[] {
  const pieces: TextPiece[] = [];
  let last = 0;
  for (const { start, end, category, group } of findings) {
    if (start > last) pieces.push({ text: text.slice(last, start) });
    pieces.push({ text: text.slice(start, end), category, colour: colourOf(group) });
    last = end;
  }
  if (last < text.length) pieces.push({ text: text.slice(last) });
  return pieces;
}

/**
 * The Placeholder each Finding would get on Hide, from a fresh Vault: the Engine's prefix
 * (DATA from an older Engine), one Placeholder per value and per person (docs/spec.md §3).
 */
export function placeholdersFor(text: string, findings: Finding[]): string[] {
  const vault: Vault = {};
  return findings.map(({ start, end, prefix = 'DATA' }) => remember(vault, text.slice(start, end), prefix));
}

/** The practice text, a short version of the demo note (docs/spec.md §5). */
export const SAMPLE_TEXT =
  'Pasienten heter Kari, fnr 01019000083, og har diabetes. Ring henne på +47 912 34 567.';

/** What the Engine finds in SAMPLE_TEXT with the Health Domain; shown while it isn't running. */
export const SAMPLE_FINDINGS: Finding[] = (
  [
    ['Kari', 'person_name', 0.6, 'PERSON', 'Name', 'contact'],
    ['01019000083', 'fodselsnummer', 0.99, 'FNR', 'Fødselsnummer', 'id'],
    ['diabetes', 'health', 0.8, 'HEALTH', 'Health', 'domain'],
    ['+47 912 34 567', 'phone', 0.9, 'PHONE', 'Phone', 'contact'],
  ] as const
).map(([value, category, confidence, prefix, name, group]) => {
  const start = SAMPLE_TEXT.indexOf(value);
  return { start, end: start + value.length, category, confidence, prefix, name, group };
});

/** Built-in Domains shown as cards; the rest go in a compact list, so the page stays small. */
const FEATURED = ['free', 'health', 'education'];

export function featuredDomains<D extends string>(all: readonly D[]): { cards: D[]; more: D[] } {
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
