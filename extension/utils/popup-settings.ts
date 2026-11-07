export const BUILT_IN_DOMAINS = ['free', 'health'] as const;

/** The Domain the Engine should use. `free` and `health` are built in; any other name is one of the user's own Domains. */
export const selectedDomain = storage.defineItem<string>('local:selectedDomain', {
  fallback: 'free',
});

/** The user's own Domains: name → their words. Kept on this computer only. */
export const customDomains = storage.defineItem<Record<string, string[]>>('local:customDomains', {
  fallback: {},
});

/**
 * Adds an empty Domain and makes it the selected one.
 * Returns false, changing nothing, if the name is empty or taken (case ignored).
 */
export async function createDomain(rawName: string): Promise<boolean> {
  const name = rawName.trim();
  const domains = await customDomains.getValue();
  const taken = [...BUILT_IN_DOMAINS, ...Object.keys(domains)].map((n) => n.toLowerCase());
  if (!name || taken.includes(name.toLowerCase())) return false;

  await customDomains.setValue({ ...domains, [name]: [] });
  await selectedDomain.setValue(name);
  return true;
}

/** Adds a word to one of the user's own Domains. Empty words and duplicates are ignored. */
export async function addWord(domain: string, rawWord: string): Promise<void> {
  const word = rawWord.trim();
  const domains = await customDomains.getValue();
  const words = domains[domain];
  if (!words || !word || words.includes(word)) return;

  await customDomains.setValue({ ...domains, [domain]: [...words, word] });
}

/** Removes a word from one of the user's own Domains. */
export async function removeWord(domain: string, word: string): Promise<void> {
  const domains = await customDomains.getValue();
  const words = domains[domain];
  if (!words) return;

  await customDomains.setValue({ ...domains, [domain]: words.filter((w) => w !== word) });
}

/** Sites Ghost Agent checks text on. `*` means every site. */
export const sites = storage.defineItem<string[]>('local:sites', {
  fallback: ['*'],
});

/** Adds a site. Empty sites and duplicates are ignored. */
export async function addSite(rawSite: string): Promise<void> {
  const site = rawSite.trim();
  const list = await sites.getValue();
  if (!site || list.includes(site)) return;

  await sites.setValue([...list, site]);
}

export async function removeSite(site: string): Promise<void> {
  await sites.setValue((await sites.getValue()).filter((s) => s !== site));
}

/** Hostnames where the user switched Ghost Agent off in the popup. Only that site is paused. */
export const pausedSites = storage.defineItem<string[]>('local:pausedSites', {
  fallback: [],
});

export async function setSitePaused(hostname: string, paused: boolean): Promise<void> {
  const others = (await pausedSites.getValue()).filter((h) => h !== hostname);
  await pausedSites.setValue(paused ? [...others, hostname] : others);
}
