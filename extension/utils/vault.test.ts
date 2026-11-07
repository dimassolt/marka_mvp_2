import { describe, expect, it } from 'vitest';
import { placeholderFor, remember } from './vault';

describe('placeholderFor', () => {
  it('numbers a new value from 1, per prefix', () => {
    expect(placeholderFor({}, '01019000083', 'FNR')).toBe('[FNR_1]');
    const vault = { '[FNR_1]': '01019000083', '[PERSON_1]': 'Kari' };
    expect(placeholderFor(vault, 'Ola', 'PERSON')).toBe('[PERSON_2]');
  });

  it('gives a value already in the Vault its Placeholder again', () => {
    const vault = { '[PERSON_1]': 'Kari', '[PERSON_2]': 'Ola' };
    expect(placeholderFor(vault, 'Kari', 'PERSON')).toBe('[PERSON_1]');
  });

  it('keeps a value its Placeholder when it is found under another prefix', () => {
    const vault = { '[DATA_1]': 'Ullevål' };
    expect(placeholderFor(vault, 'Ullevål', 'HEALTH')).toBe('[DATA_1]');
  });

  it('gives a first name or surname alone the Placeholder of the full name', () => {
    const vault = { '[PERSON_1]': 'Ola Nordmann' };
    expect(placeholderFor(vault, 'Ola', 'PERSON')).toBe('[PERSON_1]');
    expect(placeholderFor(vault, 'Nordmann', 'PERSON')).toBe('[PERSON_1]');
    expect(placeholderFor(vault, 'ola nordmann', 'PERSON')).toBe('[PERSON_1]');
  });

  it('gives a full name the Placeholder its first name already has', () => {
    const vault = { '[PERSON_1]': 'Ola' };
    expect(placeholderFor(vault, 'Ola Nordmann', 'PERSON')).toBe('[PERSON_1]');
  });

  it('gives another person with the same first name a Placeholder of their own', () => {
    const vault = { '[PERSON_1]': 'Ola Nordmann' };
    expect(placeholderFor(vault, 'Ola Hansen', 'PERSON')).toBe('[PERSON_2]');
  });

  it('gives a name that fits two people a new Placeholder, not a guess', () => {
    const vault = { '[PERSON_1]': 'Ola Nordmann', '[PERSON_2]': 'Ola Hansen' };
    expect(placeholderFor(vault, 'Ola', 'PERSON')).toBe('[PERSON_3]');
  });

  it('matches name parts only between persons', () => {
    const vault = { '[DATA_1]': 'Nordmann AS' };
    expect(placeholderFor(vault, 'Nordmann', 'PERSON')).toBe('[PERSON_1]');
    expect(placeholderFor({ '[PERSON_1]': 'Ola Nordmann' }, 'Nordmann', 'DATA')).toBe('[DATA_1]');
  });
});

describe('remember', () => {
  it('adds the value under its Placeholder and returns the Placeholder', () => {
    const vault = {};
    expect(remember(vault, 'Kari', 'PERSON')).toBe('[PERSON_1]');
    expect(vault).toEqual({ '[PERSON_1]': 'Kari' });
  });

  it('keeps the full name when the same person comes back shorter or longer', () => {
    const vault = {};
    remember(vault, 'Ola', 'PERSON');
    remember(vault, 'Ola Nordmann', 'PERSON');
    remember(vault, 'Nordmann', 'PERSON');
    expect(vault).toEqual({ '[PERSON_1]': 'Ola Nordmann' });
  });
});
