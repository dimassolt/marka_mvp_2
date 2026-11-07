import { customDomains, selectedDomain } from './popup-settings';

/** Where the local Engine listens (docs/spec.md §2). */
export const ENGINE_URL = 'http://127.0.0.1:8765';

const ICON_SIZES = [16, 32, 48, 96, 128] as const;

/** Toolbar icon paths: the ghost wears sunglasses only while the Engine is running. */
export function iconPathsFor(running: boolean): Record<number, string> {
  const folder = running ? 'active' : 'inactive';
  return Object.fromEntries(ICON_SIZES.map((size) => [size, `/icon/${folder}/${size}.png`]));
}

/** Whether the Engine is running, as last seen by checkEngine. */
export const engineRunning = storage.defineItem<boolean>('local:engineRunning', {
  fallback: false,
});

/** Asks the Engine's GET /health and stores whether it is running. */
export async function checkEngine(): Promise<void> {
  let running = false;
  log(`GET ${ENGINE_URL}/health`);
  try {
    const response = await fetch(`${ENGINE_URL}/health`);
    const body = await response.json();
    running = body.status === 'ok';
    log(`/health answered ${response.status} ${JSON.stringify(body)}`);
  } catch (error) {
    // Engine not started: nothing listens on the port.
    log(`/health failed: ${error}`);
  }
  log(`Engine ${running ? 'running' : 'down'}`);
  await engineRunning.setValue(running);
}

/** A stretch of sensitive text, as POST /detect returns it (docs/spec.md §2). Offsets are UTF-16 units. */
export interface Finding {
  start: number;
  end: number;
  category: string;
  confidence: number;
}

/**
 * Asks the Engine's POST /detect for Findings in the selected Domain.
 * If the call fails, finds nothing and marks the Engine down (no backup detection, spec §3).
 */
export async function detect(text: string): Promise<Finding[]> {
  const domain = await selectedDomain.getValue();
  // The Engine knows only the built-in Domains; one of the user's own is Free plus its words.
  const words = (await customDomains.getValue())[domain];
  const body = words ? { text, domain: 'free', words } : { text, domain };
  try {
    const response = await fetch(`${ENGINE_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const { findings } = await response.json();
    await engineRunning.setValue(true);
    return findings;
  } catch (error) {
    log(`/detect failed: ${error}`);
    await engineRunning.setValue(false);
    return [];
  }
}

/**
 * Logs to the browser console and, under `npm run dev`, to its terminal through the
 * dev server's /__log route (terminalLog in wxt.config.ts). Never log user text.
 */
function log(line: string): void {
  console.log(`[Ghost Agent] ${line}`);
  if (import.meta.env.MODE === 'development') {
    fetch('http://localhost:3000/__log', { method: 'POST', body: line }).catch(() => {});
  }
}
