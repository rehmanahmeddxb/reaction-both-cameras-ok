# Remix Reaction Video Maker — Termux build

> Create, record and export picture-in-picture reaction videos (both cameras, custom layouts,
> soundboard, audio mixing, live subtitles + Gemini viral-title generator).

**This repo used to be 2 files (`README.md` + one 376 KB zip). It now contains your full project,
unpacked and rewired so it runs on Android/Termux with a fraction of the dependencies.**

| | before (from the zip) | now |
|---|---|---|
| files in repo | 2 (`README.md` + `reaction-maker-both cnvas ok.zip`) | the zip **unchanged** + 42 unpacked project files |
| npm packages after install | 156 top-level, 8,948 files | **29 top-level, 646 files** |
| `node_modules` size | **181 MB** | **43 MB** — and **0 MB / no `node_modules` at all** if you just run the prebuilt `dist/` |
| native binaries that must match Android | esbuild (via tsx *and* vite), rollup, `@tailwindcss/oxide`, `lightningcss` | same 4, and **all four publish `android-arm64` prebuilds** → nothing is compiled on your phone |
| steps to run it | `npm install` (215 packages) and hope the postinstall binaries work | `node server.mjs` |

<sub>Measured for a real Termux target with `npm ci --os=android --cpu=arm64 --ignore-scripts`, i.e. exactly the
set of optional packages Termux downloads. On desktop Linux the slim install lands at ~46–60 MB.</sub>

---

## TL;DR — run it in Termux

```bash
pkg install -y nodejs-lts          # the ONLY thing you install
# copy the repo onto your phone, e.g.:
cd ~ && git clone https://github.com/rehmanahmeddxb/reaction-both-cameras-ok.git
cd reaction-both-cameras-ok
node server.mjs                    # ← no npm install, no node_modules
```

Then open **http://localhost:3000** in Chrome on the same phone.
(Or `./scripts/termux.sh setup && ./scripts/termux.sh start && ./scripts/termux.sh open`.)

`localhost` is a *secure context* in Chrome, so **camera + microphone permissions work over plain
http://localhost** — that's what makes this app usable from Termux without HTTPS/tunnels.
`getUserMedia` + `MediaRecorder` + canvas capture all run in Chrome, not in Node. Node only serves
files and the two Gemini endpoints.

### Want to edit the code on the phone too?

```bash
npm install --no-audit --no-fund   # 29 packages / ~43 MB / a few seconds
npm run dev                        # app on :3000 with hot reload, API on :3001
npm run build                      # → dist/ (then: node server.mjs)
```

That is the whole dependency list now:

```
react, react-dom, vite, tailwindcss, @tailwindcss/vite
```

---

## What I changed to make it Termux-safe (and how to undo any of it)

| Removed (was in the zip) | Why | How to get it back |
|---|---|---|
| `express` + `@types/express` | 5 packages for 4 routes | `server.mjs` is written with `node:http` only |
| `tsx` (+ its esbuild) | only existed to run `server.ts` | `npm i -D tsx` and rename `server.mjs` back to `server.ts` |
| `esbuild` (build script) | only bundled `server.ts` → `server.cjs` | not needed, `server.mjs` runs as-is |
| `@google/genai` (+ `protobufjs`, `gaxios`, `google-auth-library`, `web-streams-polyfill` ≈ 25 MB) | 1 SDK for 2 REST calls | `server.mjs` calls the same endpoint with `fetch()` |
| `lucide-react` (**43 MB** for ~1,600 icons) | app uses only 68 icons | `npm i lucide-react`, change `from './icons'` → `from 'lucide-react'` in `src/components/*` |
| `motion` (framer-motion, 11 MB) | **never imported anywhere** — dead dep | `npm i motion` |
| `dotenv` | 4-line parser | `npm i dotenv`, `import 'dotenv/config'` |
| `autoprefixer` + `caniuse-lite` (4.3 MB) | Tailwind v4 handles prefixes itself | not needed |
| `typescript` (23 MB) + `@types/*` | Vite/esbuild strips types; `npm run typecheck` is optional | `npm i -D typescript @types/react @types/react-dom @types/node` |
| `canvas-confetti` | one celebratory burst on download | `npm i canvas-confetti`, import from `'canvas-confetti'` |

Everything else is your original code, byte-for-byte (`src/App.tsx`, `canvasCompositor.ts`,
`audioSynthesizer.ts`, `mediaMixer.ts`, `flashlightService.ts`, all 12 components…).

Other fixes baked in:

* `vite.config.ts` → `host: true`, `strictPort`, `allowedHosts: true`, and `/api` proxied to the API port.
* `server.mjs` serves `dist/` with proper MIME types, SPA fallback, immutable caching for hashed assets,
  path-traversal guard, and **Range passthrough** on `/api/proxy-video` (video seeking was broken before).
* `.env.local` / `.env` are parsed by `server.mjs` itself — `GEMINI_API_KEY` is optional; the AI
  endpoints return sensible fallback text without it (that's exactly what the original code did).

---

## Repo layout

```
dist/                     ← PREBUILT app (committed, ~440 KB) — this is why you need no npm install
server.mjs                ← zero-dependency server: static files + Gemini API + video proxy
scripts/termux.sh         ← setup / start / dev / build / key / open / size
scripts/dev.mjs           ← dev runner (spawns vite + api, no `concurrently` needed)
index.html, vite.config.ts, tsconfig.json, metadata.json, .env.example, .gitignore
src/                      ← your app (App.tsx, 12 components, 8 utils, icons.tsx, confetti.ts)
public/assets/aistudio/   ← scratch dir the app uses
reaction-maker-both cnvas ok.zip   ← YOUR ORIGINAL UPLOAD, unchanged backup
```

Restoring the pristine project at any time:

```bash
mkdir ../restore && cd ../restore && unzip "../reaction-both-cameras-ok/reaction-maker-both cnvas ok.zip"
```

## Gemini API key (optional)

```bash
./scripts/termux.sh key AIza...      # writes .env.local (git-ignored)
```
or `cp .env.example .env.local` and edit it. Used by `/api/gemini/translate` (live subtitles) and
`/api/gemini/viral-hooks` (titles/description after a take).

## Termux notes & troubleshooting

* **Keep the project in `$HOME`** (`~/reaction-both-cameras-ok`), *not* in `/sdcard/…`. Shared storage
  is mounted noexec-ish and is very slow for `node_modules`; `~/storage` needs `termux-setup-storage`.
  Downloaded videos land in Chrome's own Downloads folder, so nothing needs shared storage to work.
* `pkg install nodejs-lts` only. You do **not** need `build-essential`, `python`, `binutils` or `nodejs-lts-dev`:
  this project compiles zero native code from source; esbuild / rollup / `@tailwindcss/oxide` /
  `lightningcss` all ship prebuilt `android-arm64` binaries (that's why the install is small and fast).
* Port busy? `PORT=8080 node server.mjs`.
* `EACCES`/`permission denied` on `node_modules` → you extracted the zip into shared storage; move it under `$HOME`.
* On a 32-bit or x86 phone (`uname -m` ≠ `aarch64`) the native bindings may not exist → use the
  **prebuilt `dist/` route** (no npm install at all, works on any CPU) or run the build in `proot-distro` Ubuntu.
* Battery/CPU throttling mid-recording → `termux-wake-lock` (the helper script does this for you).
* Open from another device (laptop) → `http://<phone-ip>:3000`, but note browsers block
  `getUserMedia` on non-localhost http, so record on the phone itself (or use an HTTPS tunnel).
* The `.zip` route also works: download the repo zip, then in Termux
  `pkg install unzip; unzip reaction-both-cameras-ok-main.zip; mv reaction-both-cameras-ok-main ~/app; cd ~/app; node server.mjs`.

## Commands

| Command | Needs node_modules? | What it does |
|---|---|---|
| `node server.mjs` | ❌ no | serves `dist/` + API on `:3000` |
| `npm start` | ❌ no | same thing |
| `npm run dev` | ✅ yes | Vite dev server `:3000` (HMR) + API `:3001` |
| `npm run build` | ✅ yes | `vite build` → `dist/` |
| `npm run typecheck` | ✅ + `npm i -D typescript @types/react @types/react-dom @types/node` | `tsc --noEmit` |

## What was checked before committing

* `npm run build` → `dist/` = 440 KB (368 KB JS + 73.7 KB CSS + index.html), 51 modules (was 1,694 with `lucide-react`).
* `tsc --noEmit` → 0 errors (typescript was only installed temporarily, it is **not** in `package.json`).
* `node server.mjs` → `/` 200, hashed assets 200 with correct MIME + `immutable` cache, SPA fallback 200,
  `/../package.json` and `/%2e%2e%2f` traversal blocked (403), `/api/health`, `/api/gemini/translate`,
  `/api/gemini/viral-hooks` all returning the fallback payloads with **no** `GEMINI_API_KEY` set.
* `npm run dev` → Vite on `:3000`, API on `:3001`, `/api` proxy confirmed, `src/main.tsx` transformed 200.
* `npm ci --os=android --cpu=arm64` → resolves `@esbuild/android-arm64`, `@rollup/rollup-android-arm64`,
  `@tailwindcss/oxide-android-arm64`, `lightningcss-android-arm64` (that's what makes Termux painless).

Camera/mic/recording itself runs in Chrome on your phone — nothing to install for that.
`metadata.json` still asks for `camera` + `microphone` frame permissions for AI Studio.
