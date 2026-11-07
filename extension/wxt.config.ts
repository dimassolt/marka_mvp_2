import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

export default defineConfig({
  manifest: {
    name: 'Ghost Agent',
    permissions: ['storage'],
  },
  vite: () => ({ plugins: [preact()] }),
});
