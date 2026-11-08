import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { checkEngine, detect, engineRunning, iconPathsFor, rephrase } from './engine-status';
import { customDomains, selectedDomain } from './popup-settings';

describe('iconPathsFor', () => {
  it('uses the ghost with sunglasses when the Engine is running', () => {
    expect(iconPathsFor(true)).toEqual({
      16: '/icon/active/16.png',
      32: '/icon/active/32.png',
      48: '/icon/active/48.png',
      96: '/icon/active/96.png',
      128: '/icon/active/128.png',
    });
  });

  it('uses the ghost without sunglasses when the Engine is not running', () => {
    expect(iconPathsFor(false)[16]).toBe('/icon/inactive/16.png');
  });
});

describe('engine running state', () => {
  beforeEach(() => fakeBrowser.reset());

  it('is not running until something says it is', async () => {
    expect(await engineRunning.getValue()).toBe(false);
  });

  it('remembers the last value it was set to', async () => {
    await engineRunning.setValue(true);
    expect(await engineRunning.getValue()).toBe(true);
  });
});

describe('checkEngine', () => {
  beforeEach(() => fakeBrowser.reset());
  afterEach(() => vi.unstubAllGlobals());

  it('marks the Engine running when GET /health answers 200 {"status": "ok"}', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ status: 'ok' }));
    vi.stubGlobal('fetch', fetch);

    await checkEngine();

    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8765/health');
    expect(await engineRunning.getValue()).toBe(true);
  });

  it('marks the Engine down when the request fails', async () => {
    await engineRunning.setValue(true);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await checkEngine();

    expect(await engineRunning.getValue()).toBe(false);
  });

  it('marks the Engine down while it answers 503 (models still loading)', async () => {
    await engineRunning.setValue(true);
    const loading = Response.json({ detail: 'loading' }, { status: 503 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(loading));

    await checkEngine();

    expect(await engineRunning.getValue()).toBe(false);
  });
});

describe('detect', () => {
  beforeEach(() => fakeBrowser.reset());
  afterEach(() => vi.unstubAllGlobals());

  const findings = [{ start: 0, end: 4, category: 'person_name', confidence: 0.6 }];

  it('sends the text and the selected built-in Domain to POST /detect', async () => {
    await selectedDomain.setValue('health');
    const fetch = vi.fn().mockResolvedValue(Response.json({ findings }));
    vi.stubGlobal('fetch', fetch);

    expect(await detect('Kari har diabetes')).toEqual(findings);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('http://127.0.0.1:8765/detect');
    expect(JSON.parse(init.body)).toEqual({ text: 'Kari har diabetes', domain: 'health' });
  });

  it("sends the Free Domain and the words of the user's own Domain", async () => {
    await customDomains.setValue({ 'ivan-personal': ['Ullevål', 'prosjekt*'] });
    await selectedDomain.setValue('ivan-personal');
    const fetch = vi.fn().mockResolvedValue(Response.json({ findings: [] }));
    vi.stubGlobal('fetch', fetch);

    await detect('Møte på Ullevål');

    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual({
      text: 'Møte på Ullevål',
      domain: 'free',
      words: ['Ullevål', 'prosjekt*'],
    });
  });

  it('finds nothing and marks the Engine down when the call fails', async () => {
    await engineRunning.setValue(true);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(await detect('Kari')).toEqual([]);
    expect(await engineRunning.getValue()).toBe(false);
  });

  it('finds nothing and marks the Engine down when it answers with an error status', async () => {
    await engineRunning.setValue(true);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({}, { status: 503 })));

    expect(await detect('Kari')).toEqual([]);
    expect(await engineRunning.getValue()).toBe(false);
  });

  it('asks the Engine once when the same text is checked again', async () => {
    const fetch = vi.fn().mockImplementation(async () => Response.json({ findings }));
    vi.stubGlobal('fetch', fetch);

    await detect('Kari kommer i morgen');
    expect(await detect('Kari kommer i morgen')).toEqual(findings);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('asks the Engine again for the same text in another Domain', async () => {
    const fetch = vi.fn().mockImplementation(async () => Response.json({ findings }));
    vi.stubGlobal('fetch', fetch);

    await detect('Kari er sykemeldt');
    await selectedDomain.setValue('health');
    await detect('Kari er sykemeldt');

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not remember a failed call', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await detect('Kari ringer');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ findings })));

    expect(await detect('Kari ringer')).toEqual(findings);
  });

  it('remembers only the last 50 texts', async () => {
    const fetch = vi.fn().mockImplementation(async () => Response.json({ findings }));
    vi.stubGlobal('fetch', fetch);

    for (let i = 0; i < 51; i++) await detect(`melding ${i}`);
    await detect('melding 50'); // newest: remembered
    await detect('melding 0'); // oldest: forgotten

    expect(fetch).toHaveBeenCalledTimes(52);
  });

  it('marks the Engine running when the call succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ findings })));

    await detect('Kari');

    expect(await engineRunning.getValue()).toBe(true);
  });
});

describe('rephrase', () => {
  beforeEach(() => fakeBrowser.reset());
  afterEach(() => vi.unstubAllGlobals());

  const sentence = 'Kari, 34 år, jobber som lærer i Bærum og har diabetes type 1.';
  const text = 'En kvinne i 30-årene som jobber i skolen, har en kronisk sykdom.';

  it('sends the sentence and the selected Domain to POST /rephrase', async () => {
    await selectedDomain.setValue('health');
    const fetch = vi.fn().mockResolvedValue(Response.json({ text }));
    vi.stubGlobal('fetch', fetch);

    expect(await rephrase(sentence)).toEqual({ ok: true, text });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('http://127.0.0.1:8765/rephrase');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ sentence, domain: 'health' });
  });

  it("sends one of the user's own Domains as Free with its words", async () => {
    await customDomains.setValue({ Prosjekt: ['ullevål'] });
    await selectedDomain.setValue('Prosjekt');
    const fetch = vi.fn().mockResolvedValue(Response.json({ text: 'Møte på et sykehus.' }));
    vi.stubGlobal('fetch', fetch);

    await rephrase('Møte på Ullevål.');

    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual({
      sentence: 'Møte på Ullevål.',
      domain: 'free',
      words: ['ullevål'],
    });
  });

  it('gives up after 15 seconds (docs/spec.md §3)', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ text }));
    vi.stubGlobal('fetch', fetch);
    const timeout = vi.spyOn(AbortSignal, 'timeout');

    await rephrase(sentence);

    expect(timeout).toHaveBeenCalledWith(15_000);
    expect(fetch.mock.calls[0]![1].signal).toBe(timeout.mock.results[0]!.value);
  });

  it.each([
    [503, 'model-missing'],
    [409, 'unsafe'],
    [422, 'failed'],
    [500, 'failed'],
  ])('reports status %i as %s', async (status, reason) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ detail: 'x' }, { status })));

    expect(await rephrase(sentence)).toEqual({ ok: false, reason });
  });

  it('reports a slow Engine as a timeout, still running', async () => {
    await engineRunning.setValue(true);
    const slow = new DOMException('signal timed out', 'TimeoutError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(slow));

    expect(await rephrase(sentence)).toEqual({ ok: false, reason: 'timeout' });
    expect(await engineRunning.getValue()).toBe(true);
  });

  it('marks the Engine down when the request fails', async () => {
    await engineRunning.setValue(true);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(await rephrase(sentence)).toEqual({ ok: false, reason: 'engine-down' });
    expect(await engineRunning.getValue()).toBe(false);
  });
});
