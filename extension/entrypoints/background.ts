import { checkEngine, detect, engineRunning, iconPathsFor } from '@/utils/engine-status';

export default defineBackground(() => {
  // Content scripts can't reach the Engine on localhost, so they ask here (docs/spec.md §3).
  browser.runtime.onMessage.addListener((message) => {
    if (message?.type === 'detect') return detect(message.text);  });

  const showIcon = (running: boolean) => browser.action.setIcon({ path: iconPathsFor(running) });
  engineRunning.getValue().then(showIcon);
  engineRunning.watch((running) => showIcon(running));

  // Check the Engine when the extension starts and on every tab switch.
  checkEngine();
  browser.tabs.onActivated.addListener(() => checkEngine());
});
