import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const page = (file) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development, forward API calls to the Express backend
    proxy: { '/api': 'http://localhost:4000' },
  },
  build: {
    rollupOptions: {
      // Two separate HTML entry points = a true multi-page app (not an SPA)
      input: {
        main: page('./index.html'),
        todo: page('./todo.html'),
      },
    },
  },
});