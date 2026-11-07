export const BUILT_IN_DOMAINS = [
  'free',
  'health',
  'education',
  'courts',
  'industrial',
  'religious',
] as const;

export type BuiltInDomain = (typeof BUILT_IN_DOMAINS)[number];

/** What the popup shows for each built-in Domain. Word counts match the Engine's keyword lists. */
export const BUILT_IN_DOMAIN_INFO: Record<BuiltInDomain, { label: string; about: string }> = {
  free: { label: 'Free', about: 'Base checks only: fnr, card, email, phone, names.' },
  health: {
    label: 'Health',
    about:
      '234 health words in Bokmål and English: diagnoses, medicines, and terms like innlagt and sykemeldt.',
  },
  education: {
    label: 'Education',
    about:
      '64 student words in Bokmål and English: special needs, absence, discipline and grades, like IOP and fravær.',
  },
  courts: {
    label: 'Courts',
    about:
      '44 court words in Bokmål and English: closed hearings, draft decisions and sensitive case types, like lukkede dører and barnevern.',
  },
  industrial: {
    label: 'Industrial',
    about:
      '64 plant words in Bokmål and English: machine makers, machine park, lines and capacity, like Fanuc and produksjonslinje.',
  },
  religious: {
    label: 'Religious',
    about:
      '51 parish words in Bokmål and English: membership, pastoral care and ceremonies, like menighet and sjelesorg.',
  },
};

export function isBuiltInDomain(domain: string): domain is BuiltInDomain {
  return (BUILT_IN_DOMAINS as readonly string[]).includes(domain);
}

/** The Domain the Engine should use. The built-in names go to the Engine as they are; any other name is one of the user's own Domains. */
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

/**
 * Adds a site by its name only, as a tab's hostname has it: `https://Claude.ai/new` → `claude.ai`.
 * Empty sites and duplicates are ignored.
 */
export async function addSite(rawSite: string): Promise<void> {
  const site = siteName(rawSite.trim());
  const list = await sites.getValue();
  if (!site || list.includes(site)) return;

  await sites.setValue([...list, site]);
}

function siteName(site: string): string {
  if (!site || site === '*') return site;
  try {
    return new URL(site.includes('://') ? site : `https://${site}`).hostname;
  } catch {
    return site;
  }
}

export async function removeSite(site: string): Promise<void> {
  await sites.setValue((await sites.getValue()).filter((s) => s !== site));
}

/** Hostnames where the user switched Ghost Agent off in the popup. Only that site is paused. */
export const pausedSites = storage.defineItem<string[]>('local:pausedSites', {
  fallback: [],
});

/** Ghost Agent checks a site covered by `*` or listed by name, unless it was switched off there. */
export function isSiteOn(hostname: string, siteList: string[], paused: string[]): boolean {
  return !paused.includes(hostname) && (siteList.includes('*') || siteList.includes(hostname));
}

export async function setSitePaused(hostname: string, paused: boolean): Promise<void> {
  const others = (await pausedSites.getValue()).filter((h) => h !== hostname);
  await pausedSites.setValue(paused ? [...others, hostname] : others);
}

/**
 * The popup switch. Off: the site leaves Sites, and if `*` still covers it, it goes on the Off list.
 * On: the site leaves the Off list, and joins Sites if nothing there covers it.
 */
export async function setSiteOn(hostname: string, on: boolean): Promise<void> {
  const list = await sites.getValue();
  if (on) {
    await setSitePaused(hostname, false);
    if (!isSiteOn(hostname, list, [])) await addSite(hostname);
  } else {
    await removeSite(hostname);
    if (list.includes('*')) await setSitePaused(hostname, true);
  }
}
