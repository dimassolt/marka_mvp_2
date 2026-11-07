/** One tab's Placeholder → original value (docs/spec.md §3). */
export type Vault = Record<string, string>;

/**
 * The Placeholder for a value: the one it already has in this tab's Vault, or the next free
 * `[PREFIX_n]`. The Engine sends the prefix with each Finding (docs/spec.md §2).
 */
export function placeholderFor(vault: Vault, value: string, prefix: string): string {
  const taken = Object.keys(vault).filter((placeholder) => placeholder.startsWith(`[${prefix}_`));
  return taken.find((placeholder) => vault[placeholder] === value) ?? `[${prefix}_${taken.length + 1}]`;
}
