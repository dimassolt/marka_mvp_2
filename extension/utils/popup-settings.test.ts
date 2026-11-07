import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  addSite,
  addWord,
  createDomain,
  customDomains,
  pausedSites,
  removeSite,
  removeWord,
  selectedDomain,
  setSitePaused,
  sites,
} from './popup-settings';

beforeEach(() => fakeBrowser.reset());

describe('selected Domain', () => {
  it('is the Free Domain until the user picks another', async () => {
    expect(await selectedDomain.getValue()).toBe('free');
  });
});

describe('createDomain', () => {
  it('adds a Domain with no words and selects it', async () => {
    await createDomain('ivan-personal');
    expect(await customDomains.getValue()).toEqual({ 'ivan-personal': [] });
    expect(await selectedDomain.getValue()).toBe('ivan-personal');
  });

  it('trims spaces around the name', async () => {
    await createDomain('  ivan-personal ');
    expect(await customDomains.getValue()).toEqual({ 'ivan-personal': [] });
  });

  it('says it created the Domain', async () => {
    expect(await createDomain('ivan-personal')).toBe(true);
  });

  it('refuses an empty name, a built-in name or a name already taken', async () => {
    await createDomain('ivan-personal');
    await customDomains.setValue({ 'ivan-personal': ['Bærum'] });
    await selectedDomain.setValue('free');

    for (const name of ['', '   ', 'free', 'Health', 'ivan-personal', 'IVAN-personal']) {
      expect(await createDomain(name)).toBe(false);
    }
    expect(await customDomains.getValue()).toEqual({ 'ivan-personal': ['Bærum'] });
    expect(await selectedDomain.getValue()).toBe('free');
  });
});

describe('addWord', () => {
  it('adds the trimmed word to the end of the Domain’s words', async () => {
    await customDomains.setValue({ 'ivan-personal': ['Nordmann'] });
    await addWord('ivan-personal', ' Bærum ');
    expect(await customDomains.getValue()).toEqual({ 'ivan-personal': ['Nordmann', 'Bærum'] });
  });

  it('ignores an empty word and a word the Domain already has', async () => {
    await customDomains.setValue({ 'ivan-personal': ['Nordmann'] });
    await addWord('ivan-personal', '   ');
    await addWord('ivan-personal', 'Nordmann ');
    expect(await customDomains.getValue()).toEqual({ 'ivan-personal': ['Nordmann'] });
  });

  it('does nothing for a Domain that is not the user’s own, like Health', async () => {
    await addWord('health', 'Ullevål');
    expect(await customDomains.getValue()).toEqual({});
  });
});

describe('removeWord', () => {
  it('removes the word and keeps the others in order', async () => {
    await customDomains.setValue({ 'ivan-personal': ['Nordmann', 'Bærum', 'Ullevål'] });
    await removeWord('ivan-personal', 'Bærum');
    expect(await customDomains.getValue()).toEqual({ 'ivan-personal': ['Nordmann', 'Ullevål'] });
  });
});

describe('sites', () => {
  it('is every site (*) until the user changes it', async () => {
    expect(await sites.getValue()).toEqual(['*']);
  });

  it('adds a trimmed site to the end', async () => {
    await addSite(' claude.ai ');
    expect(await sites.getValue()).toEqual(['*', 'claude.ai']);
  });

  it('ignores an empty site and a site already in the list', async () => {
    await addSite('  ');
    await addSite('*');
    expect(await sites.getValue()).toEqual(['*']);
  });

  it('removes a site', async () => {
    await sites.setValue(['*', 'claude.ai']);
    await removeSite('*');
    expect(await sites.getValue()).toEqual(['claude.ai']);
  });
});

describe('setSitePaused', () => {
  it('starts with no site paused', async () => {
    expect(await pausedSites.getValue()).toEqual([]);
  });

  it('pauses a site once, however often it is switched off', async () => {
    await setSitePaused('chatgpt.com', true);
    await setSitePaused('chatgpt.com', true);
    expect(await pausedSites.getValue()).toEqual(['chatgpt.com']);
  });

  it('switches a paused site back on and leaves other sites paused', async () => {
    await pausedSites.setValue(['chatgpt.com', 'claude.ai']);
    await setSitePaused('chatgpt.com', false);
    expect(await pausedSites.getValue()).toEqual(['claude.ai']);
  });
});
