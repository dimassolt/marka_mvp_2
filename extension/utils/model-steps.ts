import { MODEL_SIZE_MB, REPHRASE_MODEL_SIZE_MB, type ModelStatus, type RephraseModelStatus } from './model';

/**
 * Where one optional model is, for the popup's Models box (docs/spec.md §3, Models):
 * `done` on disk (and loaded), `loading` on disk and loading, `next` ready to download,
 * `waiting` for the step before it, `downloading`, `failed` download (try again), or
 * `broken`: on disk but it would not load, so downloading again doesn't help.
 */
export type StepState = 'done' | 'loading' | 'next' | 'waiting' | 'downloading' | 'failed' | 'broken';

export interface ModelStep {
  id: 'names' | 'rephrase';
  /** What the user gets, as the step's title. */
  title: string;
  model: string;
  sizeMb: number;
  /** What the model enables; shown on hover. */
  enables: string;
  state: StepState;
  downloadedMb: number;
  error: string | null;
}

const NAMES = {
  id: 'names',
  title: 'Names and places',
  model: 'GLiNER',
  sizeMb: MODEL_SIZE_MB,
  enables:
    'Finds surnames, organisations and places, like Nordmann, Bærum sykehus and Sandvika. ' +
    'Without it, Ghost finds first names only.',
} as const;

const REPHRASE = {
  id: 'rephrase',
  title: 'Rephrase',
  model: 'Gemma 4',
  sizeMb: REPHRASE_MODEL_SIZE_MB,
  enables:
    'Enables Rephrase on the Card: rewrites a sentence without its sensitive parts. ' +
    'Without it, use Hide.',
} as const;

/**
 * The optional models in the order to download them: GLiNER, then Gemma 4. Gemma 4 waits
 * until GLiNER is done, unless it is on disk already. Basic checks need neither model.
 * A model the Engine doesn't report (down, or too old) has no step.
 */
export function modelSteps(names: ModelStatus | null, rephrase: RephraseModelStatus | null): ModelStep[] {
  const steps: ModelStep[] = [];
  if (names) {
    const state: StepState = names.state === 'ready' ? 'done' : names.state === 'missing' ? 'next' : names.state;
    steps.push({ ...NAMES, state, downloadedMb: names.downloaded_mb, error: names.error });
  }
  if (rephrase) {
    const namesDone = !names || names.state === 'ready';
    const state = rephraseState(rephrase, namesDone);
    steps.push({ ...REPHRASE, state, downloadedMb: rephrase.downloaded_mb, error: rephrase.error });
  }
  return steps;
}

function rephraseState(status: RephraseModelStatus, namesDone: boolean): StepState {
  switch (status.state) {
    case 'ready':
      return 'done';
    case 'idle':
    case 'loading':
      return 'loading';
    case 'downloading':
      return 'downloading';
    case 'failed':
      return 'broken';
    case 'missing':
      if (!namesDone) return 'waiting';
      return status.error ? 'failed' : 'next';
  }
}
