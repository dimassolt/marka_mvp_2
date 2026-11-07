import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadModel, modelStatus, progressPercent } from './model';

afterEach(() => vi.unstubAllGlobals());

describe('modelStatus', () => {
  it('asks GET /model and returns what the Engine says', async () => {
    const status = { state: 'downloading', downloaded_mb: 120, error: null };
    const fetch = vi.fn().mockResolvedValue(Response.json(status));
    vi.stubGlobal('fetch', fetch);

    expect(await modelStatus()).toEqual(status);
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8765/model');
  });

  it('is null when the Engine is not running', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(await modelStatus()).toBeNull();
  });

  it('is null when the Engine is too old to know /model', async () => {
    const notFound = Response.json({ detail: 'Not Found' }, { status: 404 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(notFound));

    expect(await modelStatus()).toBeNull();
  });
});

describe('downloadModel', () => {
  it('asks POST /model/download and returns the new status', async () => {
    const status = { state: 'downloading', downloaded_mb: 0, error: null };
    const fetch = vi.fn().mockResolvedValue(Response.json(status, { status: 202 }));
    vi.stubGlobal('fetch', fetch);

    expect(await downloadModel()).toEqual(status);
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8765/model/download', { method: 'POST' });
  });

  it('is null when the Engine is not running', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(await downloadModel()).toBeNull();
  });
});

describe('progressPercent', () => {
  it('compares the megabytes so far with the model size of about 600 MB', () => {
    expect(progressPercent(300)).toBe(50);
  });

  it('stays below 100 until the Engine says the model is ready', () => {
    expect(progressPercent(640)).toBe(99);
  });
});
