import { describe, expect, it } from 'vitest';
import raw from '../../demo/cases.json?raw';
import { remember, type Vault } from './vault';

interface DemoCase {
  id: string;
  text: string;
  findings: { value: string; start: number; end: number; prefix: string; placeholder: string }[];
  ghost_bar: number;
  after_hide_all: string;
  vault: Vault;
}

const cases: DemoCase[] = JSON.parse(raw);

/** Hide all in a new tab: Placeholders in text order, then each value replaced, last first. */
function hideAll({ text, findings }: DemoCase) {
  const vault: Vault = {};
  const placeholders = findings.map((f) => remember(vault, f.value, f.prefix));
  let hidden = text;
  for (let i = findings.length - 1; i >= 0; i--) {
    const f = findings[i]!;
    hidden = hidden.slice(0, f.start) + placeholders[i] + hidden.slice(f.end);
  }
  return { hidden, placeholders, vault };
}

describe('demo/cases.json', () => {
  it.each(cases.map((c) => [c.id, c] as const))('%s: Hide all gives the known text and Vault', (_, c) => {
    const { hidden, placeholders, vault } = hideAll(c);
    expect(c.ghost_bar).toBe(c.findings.length);
    expect(placeholders).toEqual(c.findings.map((f) => f.placeholder));
    expect(hidden).toBe(c.after_hide_all);
    expect(vault).toEqual(c.vault);
  });

  it('marks each Finding with the value at its offsets', () => {
    for (const c of cases) for (const f of c.findings) expect(c.text.slice(f.start, f.end)).toBe(f.value);
  });
});
