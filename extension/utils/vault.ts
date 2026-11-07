/** One tab's Placeholder → original value (docs/spec.md §3). */
export type Vault = Record<string, string>;

/**
 * The Placeholder for a value: the one it already has in this tab's Vault, whatever its prefix
 * (docs/spec.md §3), or the next free `[PREFIX_n]`. The Engine sends the prefix with each Finding.
 */
export function placeholderFor(vault: Vault, value: string, prefix: string): string {
  const existing = Object.keys(vault).find((placeholder) => vault[placeholder] === value);
  if (existing) return existing;
  const taken = Object.keys(vault).filter((placeholder) => placeholder.startsWith(`[${prefix}_`));
  return `[${prefix}_${taken.length + 1}]`;
}
