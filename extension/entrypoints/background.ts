import { engineRunning, iconPathsFor } from '@/utils/engine-status';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message) => {
    if (message === 'hello') return Promise.resolve('Hello from the background worker');
  });

  const showIcon = (running: boolean) => browser.action.setIcon({ path: iconPathsFor(running) });
  engineRunning.getValue().then(showIcon);
  engineRunning.watch((running) => showIcon(running));
});
