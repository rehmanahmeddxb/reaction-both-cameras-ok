/**
 * scripts/dev.mjs — dev runner with zero extra npm packages (no concurrently, no nodemon, no tsx).
 *
 * Starts:
 *   1. node server.mjs --api-only   → the Gemini/proxy API on API_PORT  (default 3001)
 *   2. vite dev server              → the app + HMR on PORT             (default 3000)
 *
 * The Vite dev server proxies /api/* to the API, so the browser still only needs one URL:
 *   http://localhost:3000
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 3000);
const API_PORT = Number(process.env.API_PORT || 3001);

const viteBin = path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

const kids = [];
function run(name, args, color) {
  const child = spawn(process.execPath, args, { cwd: root, env: process.env });
  const tag = `\x1b[${color}m[${name}]\x1b[0m `;
  const pipe = (stream, out) =>
    stream.on('data', (b) => {
      for (const line of b.toString().split('\n')) if (line.trim()) out.write(tag + line + '\n');
    });
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    if (!exiting && code) {
      console.error(`${tag}exited with code ${code}`);
      stop(code);
    }
  });
  kids.push(child);
  return child;
}

let exiting = false;
function stop(code = 0) {
  if (exiting) return;
  exiting = true;
  for (const k of kids) k.kill('SIGTERM');
  setTimeout(() => process.exit(code), 200).unref();
}

run('api', [path.join(root, 'server.mjs'), '--api-only'], '35');
run('vite', [viteBin], '36');

console.log(`\n  🎬 Reaction Studio dev → http://localhost:${PORT}   (API on ${API_PORT})\n`);

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => stop(0));
