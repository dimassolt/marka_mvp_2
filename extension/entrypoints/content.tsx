import { render } from 'preact';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const reply: string = await browser.runtime.sendMessage('hello');

    const ui = await createShadowRootUi(ctx, {
      name: 'ghost-agent-hello',
      position: 'overlay',
      anchor: 'body',
      onMount: (container) =>
        render(
          <p
            style={{
              position: 'fixed',
              bottom: '16px',
              right: '16px',
              margin: 0,
              padding: '8px 12px',
              background: '#6b21a8',
              color: 'white',
              borderRadius: '8px',
              font: '14px sans-serif',
              zIndex: 2147483647,
            }}
          >
            {reply}
          </p>,
          container,
        ),
      onRemove: (container) => container && render(null, container),
    });
    ui.mount();
  },
});
