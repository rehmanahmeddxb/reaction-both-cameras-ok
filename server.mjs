/**
 * server.mjs — zero-dependency server for "Remix Reaction Video Maker".
 *
 * Why this file exists: the original server.ts needed express + tsx + @google/genai
 * (~60 MB of node_modules, several of them *native* binaries that are a pain on
 * Android/Termux). Everything below uses ONLY Node.js built-ins (node:http, node:fs)
 * plus the global fetch(), so it runs with `node server.mjs` and ZERO npm install.
 *
 * Modes
 *   node server.mjs                → serve ./dist (built app) + API   [port PORT, default 3000]
 *   node server.mjs --api-only     → API endpoints only (used by `npm run dev`) [port API_PORT, default 3001]
 *
 * Env (read from .env.local then .env — no dotenv package needed)
 *   GEMINI_API_KEY   optional; without it the AI endpoints return built-in fallback text
 *   GEMINI_MODEL     default "gemini-2.5-flash"
 *   PORT / API_PORT / HOST
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, 'dist');

const argv = process.argv.slice(2);
const API_ONLY = argv.includes('--api-only');
const PORT = Number(
  API_ONLY ? process.env.API_PORT || 3001 : process.env.PORT || 3000,
);
const HOST = process.env.HOST || '0.0.0.0';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/* ------------------------------------------------------------------ *
 * Tiny .env loader (replaces the `dotenv` package)
 * ------------------------------------------------------------------ */
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(ROOT, file);
    if (!existsSync(p)) continue;
    for (const raw of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}
loadEnv();

const API_KEY = process.env.GEMINI_API_KEY || '';
const hasKey = API_KEY.length > 0 && !API_KEY.includes('MY_GEMINI_API_KEY');

/* ------------------------------------------------------------------ *
 * Gemini via plain REST + fetch (replaces @google/genai)
 * ------------------------------------------------------------------ */
async function gemini(prompt, config = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': API_KEY,
    },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: config }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json().catch(() => ({}));
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p?.text ?? '').join('').trim();
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

const TRANSLATE_PROMPT = (text, targetLang) =>
  `You are an expert real-time translator for live video reaction subtitles.
Translate the following live reaction speech into natural, conversational, punchy ${targetLang}.
Keep it concise so it fits nicely on a single line of video subtitles. Do not include commentary, formatting, or quotes.

Input speech: "${text}"

Translation:`;

const HOOKS_PROMPT = (videoTitle, transcriptSnippet, durationSecs) =>
  `You are a viral YouTube Shorts, TikTok, and Instagram Reels creator strategist.
A creator just finished recording a reaction video.
Source Video Being Reacted To: "${videoTitle}"
Creator's Spoken Speech Transcript Snippet: "${transcriptSnippet || 'Genuine surprised reaction'}"
Video Length: ${Math.round(durationSecs)} seconds

Generate a viral distribution package in strictly valid JSON with:
1. "titles": an array of 3 high-click-through-rate, curiosity-inducing titles
2. "openingHook": a compelling 1-sentence opening text hook to superimpose or pin
3. "hashtags": an array of 5 top relevant trending hashtags
4. "description": an engaging 2-sentence caption/description with a call to action.

Return ONLY the raw JSON object, no markdown codeblocks or other text.`;

const fallbackHooks = (videoTitle) => ({
  titles: [
    `My REAL Reaction to ${videoTitle}! 😱`,
    `I Did NOT Expect This... (${videoTitle})`,
    `Wait for the Ending! Reacting to ${videoTitle}`,
  ],
  openingHook: 'You will not believe what just happened in this video...',
  hashtags: ['#reaction', '#trending', '#mustwatch', '#viral', '#shorts'],
  description: `Check out my genuine live reaction to ${videoTitle}! Don't forget to like and subscribe for more content!`,
});

/* ------------------------------------------------------------------ *
 * Small request helpers
 * ------------------------------------------------------------------ */
function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

function readJsonBody(req, limit = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(Object.assign(new Error('Invalid JSON body'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.m4a': 'video/mp4',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

/* ------------------------------------------------------------------ *
 * Handlers
 * ------------------------------------------------------------------ */
async function handleApi(req, res, url) {
  // 1. Health check
  if (url.pathname === '/api/health') {
    return send(res, 200, {
      status: 'ok',
      serverTime: new Date().toISOString(),
      gemini: hasKey ? 'configured' : 'fallback (no GEMINI_API_KEY)',
      model: MODEL,
    });
  }

  // 2. Real-time subtitle translation
  if (url.pathname === '/api/gemini/translate') {
    try {
      const { text, targetLang = 'Spanish' } = await readJsonBody(req);
      if (!text || typeof text !== 'string') {
        return send(res, 400, { error: 'Text string is required' });
      }
      if (!hasKey) {
        return send(res, 200, { translation: `[${targetLang}] ${text}`, source: 'fallback' });
      }
      const translation = (await gemini(TRANSLATE_PROMPT(text, targetLang), { maxOutputTokens: 60, temperature: 0.3 }))
        .replace(/^["']|["']$/g, '');
      return send(res, 200, { translation: translation || text, source: 'gemini' });
    } catch (error) {
      console.warn('Gemini translation error:', error?.message || error);
      return send(res, 200, { translation: '', source: 'fallback-error' });
    }
  }

  // 3. Post-take viral title / description generator
  if (url.pathname === '/api/gemini/viral-hooks') {
    const body = await readJsonBody(req).catch(() => ({}));
    const videoTitle = body.videoTitle || 'Reaction Video';
    try {
      if (!hasKey) {
        return send(res, 200, { ...fallbackHooks(videoTitle), source: 'fallback' });
      }
      const raw = await gemini(
        HOOKS_PROMPT(videoTitle, body.transcriptSnippet, body.durationSecs ?? 30),
        { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 600 },
      );
      let data = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
      }
      return send(res, 200, {
        titles: data.titles?.length ? data.titles : [`Reacting to ${videoTitle}!`],
        openingHook: data.openingHook || 'Wait until you see what happens...',
        hashtags: data.hashtags?.length ? data.hashtags : ['#reaction', '#viral', '#shorts'],
        description: data.description || `My reaction to ${videoTitle}!`,
        source: 'gemini',
      });
    } catch (error) {
      console.warn('Gemini viral hooks error:', error?.message || error);
      return send(res, 200, { ...fallbackHooks(body.videoTitle || 'this'), source: 'fallback-error' });
    }
  }

  // 4. CORS-safe media proxy (keeps the canvas untainted for external clips)
  if (url.pathname === '/api/proxy-video') {
    const target = url.searchParams.get('url');
    if (!target || !/^https?:\/\//i.test(target)) {
      return send(res, 400, 'Valid http/https URL required');
    }
    try {
      const headers = {};
      if (req.headers.range) headers.range = req.headers.range;
      const upstream = await fetch(target, { headers, redirect: 'follow', signal: AbortSignal.timeout(60_000) });
      if (!upstream.ok && upstream.status !== 206) {
        return send(res, upstream.status, 'Failed to fetch upstream media');
      }
      const out = {
        'content-type': upstream.headers.get('content-type') || 'video/mp4',
        'access-control-allow-origin': '*',
        'accept-ranges': 'bytes',
        'cache-control': 'public, max-age=3600',
      };
      for (const h of ['content-length', 'content-range']) {
        const v = upstream.headers.get(h);
        if (v) out[h] = v;
      }
      res.writeHead(upstream.status === 206 ? 206 : 200, out);
      if (!upstream.body) return res.end();
      // Stream through without buffering the whole clip into RAM.
      const reader = upstream.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!res.write(Buffer.from(value))) {
          await new Promise((r) => res.once('drain', r));
        }
      }
      return res.end();
    } catch (err) {
      console.warn('Proxy video error:', err?.message);
      return send(res, 502, 'Error proxying media');
    }
  }

  return send(res, 404, { error: 'Unknown endpoint' });
}

async function serveStatic(req, res, url) {
  if (!existsSync(DIST)) {
    return send(
      res,
      503,
      'No ./dist folder yet.\n\n  Option A (phone only, no build tools): use the prebuilt dist/ that ships in this repo — make sure you cloned/extracted the whole repo, not just server.mjs.\n  Option B (rebuild): npm install && npm run build\n',
    );
  }
  let rel = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  if (rel === '' || rel === 'index.html') rel = 'index.html';
  let filePath = path.join(DIST, rel);
  if (!filePath.startsWith(DIST + path.sep) && filePath !== DIST) {
    return send(res, 403, 'Forbidden');
  }
  let info = await fs.stat(filePath).catch(() => null);
  if (info?.isDirectory() || !info) {
    filePath = path.join(DIST, 'index.html'); // SPA fallback
    info = await fs.stat(filePath).catch(() => null);
    if (!info) return send(res, 404, 'Not found');
  }
  const ext = path.extname(filePath).toLowerCase();
  const isHashed = /-[A-Za-z0-9_-]{6,}\.(js|css|map)$/.test(path.basename(filePath));
  res.writeHead(200, {
    'content-type': MIME[ext] || 'application/octet-stream',
    'content-length': info.size,
    'cache-control': isHashed ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return void (await handleApi(req, res, url));
    if (API_ONLY) return send(res, 404, 'API-only mode: the Vite dev server serves the app');
    return void (await serveStatic(req, res, url));
  } catch (err) {
    console.error('Request failed:', err);
    if (!res.headersSent) send(res, 500, 'Internal error');
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  const what = API_ONLY ? 'API (dev mode)' : 'app + API (static mode)';
  console.log(`⚡ Remix Reaction Maker — ${what} listening on http://${HOST}:${PORT}`);
  console.log(`   Gemini AI: ${hasKey ? `enabled (${MODEL})` : 'no GEMINI_API_KEY → using built-in fallback text'}`);
  if (!API_ONLY && !existsSync(DIST)) console.log('   ⚠ ./dist missing — run: npm run build');
  if (process.platform === 'android') console.log('   📱 Termux? open http://localhost:' + PORT + ' in Chrome/Firefox (localhost = secure context, so camera + mic permissions work)');
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
  });
}
