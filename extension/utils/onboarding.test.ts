import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { sites } from './popup-settings';
import {
  SAMPLE_FINDINGS,
  SAMPLE_TEXT,
  featuredDomains,
  AI_CHAT_SITES,
  checkEverywhere,
  checkOnlyChosenSites,
  onboardingDone,
  openOnboardingOnInstall,
  placeholdersFor,
  splitByFindings,
} from './onboarding';

beforeEach(() => fakeBrowser.reset());

describe('openOnboardingOnInstall', () => {
  it('opens the onboarding tab when the extension is first installed', async () => {
    const create = vi.spyOn(fakeBrowser.tabs, 'create');
    await openOnboardingOnInstall({ reason: 'install' });
    expect(create).toHaveBeenCalledWith({ url: browser.runtime.getURL('/onboarding.html') });
  });

  it('stays closed on an update, so a new version does not interrupt the user', async () => {
    const create = vi.spyOn(fakeBrowser.tabs, 'create');
    await openOnboardingOnInstall({ reason: 'update' });
    expect(create).not.toHaveBeenCalled();
  });

  it('stays closed once the user finished onboarding', async () => {
    await onboardingDone.setValue(true);
    const create = vi.spyOn(fakeBrowser.tabs, 'create');
    await openOnboardingOnInstall({ reason: 'install' });
    expect(create).not.toHaveBeenCalled();
  });
});

describe('splitByFindings', () => {
  it('splits text into plain pieces and underlined Findings, coloured by the group the Engine sends', () => {
    const findings = [
      { start: 0, end: 4, category: 'person_name', confidence: 0.6, group: 'contact' },
      { start: 9, end: 17, category: 'health', confidence: 0.8, group: 'domain' },
      { start: 23, end: 34, category: 'fodselsnummer', confidence: 0.99, group: 'id' },
    ];
    expect(splitByFindings('Kari har diabetes, fnr 01019000083', findings)).toEqual([
      { text: 'Kari', category: 'person_name', colour: 'contact' },
      { text: ' har ' },
      { text: 'diabetes', category: 'health', colour: 'domain' },
      { text: ', fnr ' },
      { text: '01019000083', category: 'fodselsnummer', colour: 'id' },
    ]);
  });

  it('underlines a Finding from an older Engine without a group in teal', () => {
    const findings = [{ start: 0, end: 4, category: 'person_name', confidence: 0.6 }];
    expect(splitByFindings('Kari', findings)).toEqual([
      { text: 'Kari', category: 'person_name', colour: 'domain' },
    ]);
  });
});

describe('the sample text', () => {
  it('has ready-made Findings for when the Engine is not running, as Health would find them', () => {
    const underlined = splitByFindings(SAMPLE_TEXT, SAMPLE_FINDINGS)
      .filter((piece) => 'colour' in piece)
      .map((piece) => [piece.text, piece.colour]);
    expect(underlined).toEqual([
      ['Kari', 'contact'],
      ['01019000083', 'id'],
      ['diabetes', 'domain'],
      ['+47 912 34 567', 'contact'],
    ]);
  });

  it('carries the prefix and Card name the Engine would send', () => {
    expect(SAMPLE_FINDINGS.map(({ prefix, name }) => [prefix, name])).toEqual([
      ['PERSON', 'Name'],
      ['FNR', 'Fødselsnummer'],
      ['HEALTH', 'Health'],
      ['PHONE', 'Phone'],
    ]);
  });
});

describe('placeholdersFor', () => {
  const at = (text: string, value: string, prefix?: string, from = 0) => {
    const start = text.indexOf(value, from);
    return { start, end: start + value.length, category: 'x', confidence: 1, prefix };
  };

  it('gives each value the Placeholder Hide would give it, numbered per prefix from the Engine', () => {
    const text = 'Kari, 01019000083, Ola, Kari';
    const findings = [
      at(text, 'Kari', 'PERSON'),
      at(text, '01019000083', 'FNR'),
      at(text, 'Ola', 'PERSON'),
      at(text, 'Kari', 'PERSON', 20),
    ];
    expect(placeholdersFor(text, findings)).toEqual(['[PERSON_1]', '[FNR_1]', '[PERSON_2]', '[PERSON_1]']);
  });

  it('gives one person one Placeholder, full name or not', () => {
    const text = 'Kari Nordmann ringte. Kari kommer i morgen.';
    const findings = [at(text, 'Kari Nordmann', 'PERSON'), at(text, 'Kari', 'PERSON', 20)];
    expect(placeholdersFor(text, findings)).toEqual(['[PERSON_1]', '[PERSON_1]']);
  });

  it('falls back to DATA when an older Engine sends no prefix', () => {
    const text = 'Ullevål';
    expect(placeholdersFor(text, [at(text, 'Ullevål')])).toEqual(['[DATA_1]']);
  });
});

describe('featuredDomains', () => {
  const all = ['free', 'health', 'education', 'courts', 'industrial', 'religious'];

  it('shows Free and two built-in Domains as cards, the rest in a list', () => {
    expect(featuredDomains(all)).toEqual({
      cards: ['free', 'health', 'education'],
      more: ['courts', 'industrial', 'religious'],
    });
  });

  it('shows only the Domains that exist', () => {
    expect(featuredDomains(['free', 'health'])).toEqual({ cards: ['free', 'health'], more: [] });
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
