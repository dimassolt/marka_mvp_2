import { checkEngine, detect, iconPathsFor, rephrase } from '@/utils/engine-status';
import { markTourOnInstall } from '@/utils/onboarding';
import { remember, type Vault } from '@/utils/vault';

export default defineBackground(() => {
  // A fresh install gets the tour the first time the popup opens; an update doesn't.
  browser.runtime.onInstalled.addListener(markTourOnInstall);

  browser.runtime.onMessage.addListener((message, sender) => {
    // Content scripts can't reach the Engine on localhost, so they ask here (docs/spec.md §3).
    if (message?.type === 'detect') return detect(message.text);
    if (message?.type === 'rephrase') return rephrase(message.sentence);
    // Each tab's icon comes from its page; tabs without one keep the default, no sunglasses.
    if (message?.type === 'icon' && sender.tab?.id !== undefined) {
      browser.action.setIcon({ tabId: sender.tab.id, path: iconPathsFor(message.on) });
    }
    if (message?.type === 'placeholders' && sender.tab?.id !== undefined) {
      return placeholders(sender.tab.id, message.items, message.save);
    }
  });

  // A closed tab's Vault is no longer needed.
  browser.tabs.onRemoved.addListener((tabId) => storage.removeItem(vaultKey(tabId)));

  // Check the Engine when the extension starts and on every tab switch.
  checkEngine();
  browser.tabs.onActivated.addListener(() => checkEngine());
});

/** The tab's Vault in session storage: memory only, cleared when the browser closes (spec §3). */
function vaultKey(tabId: number) {
  return `session:vault-${tabId}` as const;
}

/** Hides run one at a time, so two of them never hand out the same Placeholder. */
let queue: Promise<unknown> = Promise.resolve();

/**
 * The Placeholder for each value, from the tab's Vault. With `save`, new ones are added to the
 * Vault; without it, the Card only shows what Hide would write.
 */
function placeholders(tabId: number, items: { value: string; prefix: string }[], save: boolean): Promise<string[]> {
  const run = queue.then(async () => {
    const vault: Vault = (await storage.getItem<Vault>(vaultKey(tabId))) ?? {};
    const result = items.map(({ value, prefix }) => remember(vault, value, prefix));
    if (save) await storage.setItem(vaultKey(tabId), vault);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}
