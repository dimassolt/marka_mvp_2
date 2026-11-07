import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { engineRunning, iconPathsFor } from './engine-status';

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
