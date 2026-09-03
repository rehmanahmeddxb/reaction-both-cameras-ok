import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const env = { ...process.env };
// read PORT / API_PORT out of .env.local / .env the same way server.mjs does
for (const file of ['.env.local', '.env']) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const PORT = Number(env.PORT || 3000);
const API_PORT = Number(env.API_PORT || 3001);

export default defineConfig(() => ({
  plugins: [tailwindcss()],
  resolve: {
    alias: { '@': root },
  },
  server: {
    host: true, // listen on 0.0.0.0 so you can also open the phone's own LAN IP
    port: PORT,
    strictPort: true,
    // Vite 6 blocks unknown Host headers; allow the Termux/preview/lan hosts you may use.
    allowedHosts: true as const,
    hmr: env.DISABLE_HMR === 'true' ? false : true,
    watch: env.DISABLE_HMR === 'true' ? null : {},
    proxy: {
      // The API lives in server.mjs (zero deps) — this keeps one URL for the browser.
      '/api': { target: `http://127.0.0.1:${API_PORT}`, changeOrigin: true },
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
  envDir: root,
}));
