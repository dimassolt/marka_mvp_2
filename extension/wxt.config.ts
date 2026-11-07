import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';
import type { Plugin } from 'vite';

/** Prints the extension's log() lines in the `npm run dev` terminal. */
const terminalLog: Plugin = {
  name: 'ghost-terminal-log',
  configureServer(server) {
    server.middlewares.use('/__log', (req, res) => {
      let line = '';
      req.on('data', (chunk) => (line += chunk));
      req.on('end', () => {
        console.log(`[Ghost Agent] ${line}`);
        res.end();
      });
    });
  },
};

export default defineConfig({
  manifest: {
    name: 'Ghost Agent',
    // activeTab: the popup reads the current tab's hostname for the site switch.
    permissions: ['storage', 'activeTab'],
    // The local Engine (ENGINE_URL in utils/engine-status.ts): lets the extension call it
    // without CORS headers.
    host_permissions: ['http://127.0.0.1:8765/*'],
  },
  vite: () => ({ plugins: [preact(), terminalLog] }),
});
