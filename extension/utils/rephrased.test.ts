import { describe, expect, it } from 'vitest';
import { outsideRephrased } from './rephrased';

// docs/spec.md §3, Rephrase: the Engine checked an accepted rewrite, so a scan doesn't flag it.
const at = (text: string, value: string, category = 'person') => {
  const start = text.indexOf(value);
  return { start, end: start + value.length, category, confidence: 0.8 };
};

describe('outsideRephrased (fix/rephrase)', () => {
  const rewrite = 'Noen i familien har en helseutfordring';
  const text = `Kari Nordmann bor i Bærum. ${rewrite}. Ring Ola.`;

  it('drops Findings inside an accepted rewrite and keeps the rest', () => {
    const findings = [at(text, 'Kari Nordmann'), at(text, 'Noen'), at(text, 'helseutfordring', 'health'), at(text, 'Ola')];
    expect(outsideRephrased(findings, text, [rewrite])).toEqual([at(text, 'Kari Nordmann'), at(text, 'Ola')]);
  });

  it('flags the rewrite again once the user has typed inside it', () => {
    const edited = text.replace('Noen i familien', 'Noen i familien, Per Hansen,');
    expect(outsideRephrased([at(edited, 'Per Hansen')], edited, [rewrite])).toEqual([at(edited, 'Per Hansen')]);
  });

  it('keeps a Finding that only overlaps the rewrite', () => {
    const joinedText = `Ring Kari ${rewrite}`;
    const finding = { start: 5, end: 14, category: 'person', confidence: 0.8 }; // "Kari Noen"
    expect(outsideRephrased([finding], joinedText, [rewrite])).toEqual([finding]);
  });
});
