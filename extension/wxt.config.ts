import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

export default defineConfig({
  manifest: {
    name: 'Ghost Agent',
    // activeTab: the popup reads the current tab's hostname for the site switch.
    permissions: ['storage', 'activeTab'],
  },
  vite: () => ({ plugins: [preact()] }),
});
