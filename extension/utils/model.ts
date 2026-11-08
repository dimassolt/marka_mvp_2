import { ENGINE_URL } from './engine-status';

/**
 * The GLiNER model on the Engine's machine, as GET /model returns it (docs/spec.md §2).
 * Without it the Engine still runs, but finds no surnames, organisations or places.
 */
export interface ModelStatus {
  state: 'missing' | 'downloading' | 'ready' | 'failed';
  /** Megabytes on disk so far, while downloading. */
  downloaded_mb: number;
  /** Why the last download failed. */
  error: string | null;
}

/** Asks the Engine's GET /model. Null when the Engine is down or too old to know /model. */
export async function modelStatus(): Promise<ModelStatus | null> {
  try {
    const response = await fetch(`${ENGINE_URL}/model`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

/**
 * Asks the Engine to download the model (POST /model/download), like the install scripts do.
 * The Engine downloads in the background; poll modelStatus for progress. Null when it's down.
 */
export async function downloadModel(): Promise<ModelStatus | null> {
  try {
    const response = await fetch(`${ENGINE_URL}/model/download`, { method: 'POST' });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

/** The model's download size, as the install scripts say: about 600 MB. */
export const MODEL_SIZE_MB = 600;

/** How far the download is, for the progress bar. Never 100 before the Engine says ready. */
export function progressPercent(downloadedMb: number, sizeMb = MODEL_SIZE_MB): number {
  return Math.min(99, Math.round((downloadedMb / sizeMb) * 100));
}

/**
 * The rephrase model (Gemma 4 E2B), as GET /rephrase/model returns it (docs/spec.md §2).
 * The Engine starts loading it at startup; `idle` means it is on disk but not loaded yet.
 */
export interface RephraseModelStatus {
  state: 'idle' | 'loading' | 'ready' | 'missing' | 'downloading' | 'failed';
  /** Megabytes on disk so far, while downloading. */
  downloaded_mb: number;
  /** Why the model failed to load (`failed`), or why the last download failed (`missing`). */
  error: string | null;
}

/** The rephrase model's download size, as the install scripts say: about 3.1 GB. */
export const REPHRASE_MODEL_SIZE_MB = 3100;

/** Asks the Engine's GET /rephrase/model. Null when the Engine is down or too old to know it. */
export async function rephraseModelStatus(): Promise<RephraseModelStatus | null> {
  try {
    const response = await fetch(`${ENGINE_URL}/rephrase/model`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

/**
 * Asks the Engine to download the rephrase model (POST /rephrase/model/download), like
 * scripts/fetch_rephrase_model.py does. It loads once downloaded. Null when the Engine is down.
 */
export async function downloadRephraseModel(): Promise<RephraseModelStatus | null> {
  try {
    const response = await fetch(`${ENGINE_URL}/rephrase/model/download`, { method: 'POST' });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}
