import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    ssr: 'scripts/ssr-smoke.jsx',
    outDir: 'dist-ssr',
    emptyOutDir: true,
    minify: false,
  },
});
