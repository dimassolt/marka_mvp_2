import { customDomains, selectedDomain } from './popup-settings';

/** Where the local Engine listens (docs/spec.md §2). */
export const ENGINE_URL = 'http://127.0.0.1:8765';

const ICON_SIZES = [16, 32, 48, 96, 128] as const;

/** Toolbar icon paths: the ghost wears sunglasses only while it checks the tab's site. */
export function iconPathsFor(on: boolean): Record<number, string> {
  const folder = on ? 'active' : 'inactive';
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

/**
 * A stretch of sensitive text, as POST /detect returns it (docs/spec.md §2). Offsets are UTF-16 units.
 * The Engine owns the Categories, so it also sends the Placeholder prefix, the Card's name and the
 * underline group.
 */
export interface Finding {
  start: number;
  end: number;
  category: string;
  confidence: number;
  // An Engine older than the Extension leaves these out (docs/spec.md §1: unknown → DATA).
  prefix?: string;
  name?: string;
  group?: string;
}

/**
 * The last answers of POST /detect, by request body (text, Domain and words). Memory only,
 * never on disk (ADR-0001); lost when the browser puts the worker to sleep.
 */
const answers = new Map<string, Finding[]>();
const REMEMBERED_ANSWERS = 50;

/**
 * Asks the Engine's POST /detect for Findings in the selected Domain.
 * The same request again gets the remembered answer, without asking the Engine.
 * If the call fails, finds nothing and marks the Engine down (no backup detection, spec §3).
 */
export async function detect(text: string): Promise<Finding[]> {
  const body = JSON.stringify({ text, ...(await domainFields()) });
  const remembered = answers.get(body);
  if (remembered) return remembered;
  try {
    const response = await fetch(`${ENGINE_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const { findings } = await response.json();
    await engineRunning.setValue(true);
    answers.set(body, findings);
    // A Map keeps insertion order, so its first key is the oldest answer.
    if (answers.size > REMEMBERED_ANSWERS) answers.delete(answers.keys().next().value!);
    return findings;
  } catch (error) {
    log(`/detect failed: ${error}`);
    await engineRunning.setValue(false);
    return [];
  }
}

/** How long the Card waits for a rephrased sentence (docs/spec.md §3). */
export const REPHRASE_TIMEOUT_MS = 15_000;

/** Why there is no rephrased sentence; the Card says it in words. */
export type RephraseFailure = 'engine-down' | 'model-missing' | 'unsafe' | 'timeout' | 'failed';
export type RephraseResult = { ok: true; text: string } | { ok: false; reason: RephraseFailure };

/**
 * Asks the Engine's POST /rephrase to rewrite one sentence in the selected Domain.
 * Never remembered: the user may ask again for another wording.
 */
export async function rephrase(sentence: string): Promise<RephraseResult> {
  try {
    const response = await fetch(`${ENGINE_URL}/rephrase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence, ...(await domainFields()) }),
      signal: AbortSignal.timeout(REPHRASE_TIMEOUT_MS),
    });
    await engineRunning.setValue(true);
    // 503: the model isn't downloaded. 409: every rewrite still revealed something.
    if (response.status === 503) return { ok: false, reason: 'model-missing' };
    if (response.status === 409) return { ok: false, reason: 'unsafe' };
    if (!response.ok) return { ok: false, reason: 'failed' };
    const { text } = await response.json();
    return typeof text === 'string' && text ? { ok: true, text } : { ok: false, reason: 'failed' };
  } catch (error) {
    // A slow model is not a stopped Engine.
    if (error instanceof DOMException && error.name === 'TimeoutError') return { ok: false, reason: 'timeout' };
    log(`/rephrase failed: ${error}`);
    await engineRunning.setValue(false);
    return { ok: false, reason: 'engine-down' };
  }
}

/** The Domain fields of a request. The Engine knows only the built-in Domains; one of the
 * user's own is Free plus its words. */
async function domainFields(): Promise<{ domain: string; words?: string[] }> {
  const domain = await selectedDomain.getValue();
  const words = (await customDomains.getValue())[domain];
  return words ? { domain: 'free', words } : { domain };
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
