import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { checkEngine, engineRunning, iconPathsFor } from './engine-status';

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
