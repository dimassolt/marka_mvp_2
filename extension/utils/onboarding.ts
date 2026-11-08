import { sites } from './popup-settings';

/** Suggested when the user wants Ghost Agent on chosen sites only. */
export const AI_CHAT_SITES = ['chatgpt.com', 'claude.ai', 'gemini.google.com'];

/** Check every site (`*`). Sites the user chose stay listed, for when they switch back. */
export async function checkEverywhere(): Promise<void> {
  const list = await sites.getValue();
  if (!list.includes('*')) await sites.setValue(['*', ...list]);
}

/** Check only listed sites. With none listed yet, start from the common AI chats. */
export async function checkOnlyChosenSites(): Promise<void> {
  const chosen = (await sites.getValue()).filter((s) => s !== '*');
  await sites.setValue(chosen.length > 0 ? chosen : AI_CHAT_SITES);
}

/**
 * Whether the popup should show the tour. Only a fresh install sets it, so people who
 * already use Ghost Agent never get it on an update. Done or Skip clears it.
 */
export const tourPending = storage.defineItem<boolean>('local:tourPending', {
  fallback: false,
});

/** On a fresh install, not an update, marks the tour for the next popup open. */
export async function markTourOnInstall({ reason }: { reason: string }): Promise<void> {
  if (reason === 'install') await tourPending.setValue(true);
}
