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
export function progressPercent(downloadedMb: number): number {
  return Math.min(99, Math.round((downloadedMb / MODEL_SIZE_MB) * 100));
}
