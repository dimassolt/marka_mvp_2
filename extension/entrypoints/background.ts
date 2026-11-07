import { checkEngine, detect, iconPathsFor } from '@/utils/engine-status';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender) => {
    // Content scripts can't reach the Engine on localhost, so they ask here (docs/spec.md §3).
    if (message?.type === 'detect') return detect(message.text);
    // Each tab's icon comes from its page; tabs without one keep the default, no sunglasses.
    if (message?.type === 'icon' && sender.tab?.id !== undefined) {
      browser.action.setIcon({ tabId: sender.tab.id, path: iconPathsFor(message.on) });
    }
  });

  // Check the Engine when the extension starts and on every tab switch.
  checkEngine();
  browser.tabs.onActivated.addListener(() => checkEngine());
});
