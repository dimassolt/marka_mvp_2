import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { sites } from './popup-settings';
import { AI_CHAT_SITES, checkEverywhere, checkOnlyChosenSites, markTourOnInstall, tourPending } from './onboarding';

beforeEach(() => fakeBrowser.reset());

describe('markTourOnInstall', () => {
  it('has no tour pending before anything happens', async () => {
    expect(await tourPending.getValue()).toBe(false);
  });

  it('marks the tour pending on a fresh install, so the popup shows it next time it opens', async () => {
    await markTourOnInstall({ reason: 'install' });
    expect(await tourPending.getValue()).toBe(true);
  });

  it('leaves an existing user alone on an update', async () => {
    await markTourOnInstall({ reason: 'update' });
    expect(await tourPending.getValue()).toBe(false);
  });
});

describe('where Ghost Agent works', () => {
  it('works everywhere until the user chooses otherwise', async () => {
    expect(await sites.getValue()).toEqual(['*']);
  });

  it('switches from everywhere to the common AI chats, so it is never on nowhere', async () => {
    await checkOnlyChosenSites();
    expect(await sites.getValue()).toEqual(AI_CHAT_SITES);
    expect(AI_CHAT_SITES).toEqual(['chatgpt.com', 'claude.ai', 'gemini.google.com']);
  });

  it('keeps the sites the user already chose', async () => {
    await sites.setValue(['*', 'intranet.example.no']);
    await checkOnlyChosenSites();
    expect(await sites.getValue()).toEqual(['intranet.example.no']);
  });

  it('goes back to every site, keeping the chosen ones for later', async () => {
    await sites.setValue(['claude.ai']);
    await checkEverywhere();
    expect(await sites.getValue()).toEqual(['*', 'claude.ai']);
  });
});
