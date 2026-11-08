/** One tab's Placeholder → original value (docs/spec.md §3). */
export type Vault = Record<string, string>;

const PERSON = 'PERSON';

/**
 * The Placeholder for a value: the one it already has in this tab's Vault, whatever its prefix
 * (docs/spec.md §3), or the next free `[PREFIX_n]`. The Engine sends the prefix with each Finding.
 * A person keeps one Placeholder however the name is written: `Ola`, `Nordmann` and
 * `Ola Nordmann` are the same person, unless the short name fits two people in the Vault.
 */
export function placeholderFor(vault: Vault, value: string, prefix: string): string {
  const existing = Object.keys(vault).find((placeholder) => vault[placeholder] === value);
  if (existing) return existing;
  if (prefix === PERSON) {
    const people = Object.entries(vault).filter(
      ([placeholder, known]) => placeholder.startsWith(`[${PERSON}_`) && samePerson(known, value),
    );
    const [person] = people;
    if (person && people.length === 1) return person[0];
  }
  const taken = Object.keys(vault).filter((placeholder) => placeholder.startsWith(`[${prefix}_`));
  return `[${prefix}_${taken.length + 1}]`;
}

/**
 * Adds the value to the Vault under its Placeholder and returns the Placeholder. For a person
 * the Vault keeps the longest form of the name, so Restore shows the full name.
 */
export function remember(vault: Vault, value: string, prefix: string): string {
  const placeholder = placeholderFor(vault, value, prefix);
  const known = vault[placeholder];
  if (!known || value.length > known.length) vault[placeholder] = value;
  return placeholder;
}

/** One name's words are all in the other's, any case: `Ola` and `Ola Nordmann`. */
function samePerson(a: string, b: string): boolean {
  const [x, y] = [words(a), words(b)];
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.length > 0 && short.every((word) => long.includes(word));
}

function words(name: string): string[] {
  return name.toLowerCase().split(/\s+/).filter(Boolean);
}
