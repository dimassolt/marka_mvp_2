import { describe, expect, it } from 'vitest';
import type { ModelStatus, RephraseModelStatus } from './model';
import { modelSteps } from './model-steps';

// docs/spec.md §3, Models: GLiNER first, then Gemma 4. Basic checks need neither.
const names = (state: ModelStatus['state'], extra: Partial<ModelStatus> = {}): ModelStatus => ({
  state,
  downloaded_mb: 0,
  error: null,
  ...extra,
});
const gemma = (state: RephraseModelStatus['state'], extra: Partial<RephraseModelStatus> = {}): RephraseModelStatus => ({
  state,
  downloaded_mb: 0,
  error: null,
  ...extra,
});
const states = (n: ModelStatus | null, g: RephraseModelStatus | null) => modelSteps(n, g).map((s) => s.state);

describe('modelSteps', () => {
  it('lists GLiNER first and Gemma 4 second, each with what it enables', () => {
    const [first, second] = modelSteps(names('missing'), gemma('missing'));
    expect([first?.id, first?.model, first?.sizeMb]).toEqual(['names', 'GLiNER', 600]);
    expect([second?.id, second?.model, second?.sizeMb]).toEqual(['rephrase', 'Gemma 4', 3100]);
    expect(first?.enables).toMatch(/surnames, organisations and places/);
    expect(second?.enables).toMatch(/Rephrase/);
  });

  it('offers only GLiNER while neither is downloaded; Gemma 4 waits for it', () => {
    expect(states(names('missing'), gemma('missing'))).toEqual(['next', 'waiting']);
    expect(states(names('downloading'), gemma('missing'))).toEqual(['downloading', 'waiting']);
  });

  it('offers Gemma 4 once GLiNER is done', () => {
    expect(states(names('ready'), gemma('missing'))).toEqual(['done', 'next']);
    expect(states(names('ready'), gemma('downloading'))).toEqual(['done', 'downloading']);
  });

  it('counts Gemma 4 on disk as done or loading, whatever the order it came in', () => {
    expect(states(names('missing'), gemma('ready'))).toEqual(['next', 'done']);
    expect(states(names('ready'), gemma('idle'))).toEqual(['done', 'loading']);
    expect(states(names('ready'), gemma('loading'))).toEqual(['done', 'loading']);
  });

  it('shows a failed download with its error, so the user can try again', () => {
    const [first] = modelSteps(names('failed', { error: 'no network' }), gemma('missing'));
    expect([first?.state, first?.error]).toEqual(['failed', 'no network']);
    expect(states(names('ready'), gemma('missing', { error: 'no network' }))).toEqual(['done', 'failed']);
  });

  it('shows a model that is on disk but would not load as broken, not as a download to retry', () => {
    const [, second] = modelSteps(names('ready'), gemma('failed', { error: 'not a GGUF file' }));
    expect([second?.state, second?.error]).toEqual(['broken', 'not a GGUF file']);
  });

  it('is empty when the Engine is down or too old to say', () => {
    expect(modelSteps(null, null)).toEqual([]);
  });
});
