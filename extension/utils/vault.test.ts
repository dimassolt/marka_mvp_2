import { describe, expect, it } from 'vitest';
import { placeholderFor } from './vault';

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
});
