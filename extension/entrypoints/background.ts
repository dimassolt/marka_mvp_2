export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message) => {
    if (message === 'hello') return Promise.resolve('Hello from the background worker');
  });
});
