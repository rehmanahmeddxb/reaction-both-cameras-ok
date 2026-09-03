#!/data/data/com.termux/files/usr/bin/bash
# ---------------------------------------------------------------------------
# One helper for everything on Termux (Android). Also fine on Linux/macOS.
#
#   ./scripts/termux.sh setup     # pkg install nodejs-lts (only thing you need)
#   ./scripts/termux.sh start     # run the PREBUILT app  → zero npm install
#   ./scripts/termux.sh dev       # rebuild-tools mode with hot reload (needs npm install)
#   ./scripts/termux.sh build     # npm install + npm run build (only if you edit the code)
#   ./scripts/termux.sh key KEY   # save your GEMINI_API_KEY into .env.local
#   ./scripts/termux.sh open      # open the app in your phone browser
#   ./scripts/termux.sh size      # show how much node_modules actually costs
# ---------------------------------------------------------------------------
set -euo pipefail

# repo root = one level up from this script
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${PORT:-3000}"

have() { command -v "$1" >/dev/null 2>&1; }
is_termux() { [ -n "${PREFIX:-}" ] && [ "${PREFIX#/data/data/com.termux}" != "$PREFIX" ]; }

say() { printf '\n\033[36m== %s\033[0m\n' "$*"; }

cmd="${1:-start}"
shift || true

case "$cmd" in
  setup)
    if is_termux; then
      say "Installing Node.js LTS from Termux (.deb) — no compilers, no npm -g installs"
      pkg update -y
      # nodejs-lts only. Not "build-essential", not python: this project compiles nothing.
      pkg install -y nodejs-lts
    else
      say "Not inside Termux — checking for Node instead"
      have node || { echo "Install Node 18+ first (https://nodejs.org)"; exit 1; }
    fi
    have node && node -v
    have npm && npm -v
    say "Setup done."
    echo "  next:  ./scripts/termux.sh start     (prebuilt, no npm install at all)"
    echo "         ./scripts/termux.sh dev       (only if you want to edit src/ on the phone)"
    ;;

  key)
    KEY="${1:-}"
    [ -n "$KEY" ] || { echo "usage: ./scripts/termux.sh key YOUR_GEMINI_API_KEY"; exit 1; }
    umask 077
    if [ -f .env.local ]; then
      sed -i.bak "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=\"$KEY\"|" .env.local && rm -f .env.local.bak
    else
      printf 'GEMINI_API_KEY="%s"\n' "$KEY" > .env.local
    fi
    echo "Saved to .env.local (git-ignored). Restart the server to pick it up."
    ;;

  start)
    have node || { echo "Node missing → run:  ./scripts/termux.sh setup"; exit 1; }
    if [ ! -f dist/index.html ]; then
      say "dist/ missing — building once (this is the only step that needs npm install)"
      npm install --no-audit --no-fund
      npm run build
    fi
    is_termux && termux-wake-lock 2>/dev/null || true
    say "Serving prebuilt app on http://localhost:$PORT  (Ctrl-C to stop)"
    PORT="$PORT" exec node server.mjs
    ;;

  dev)
    have node || { echo "Node missing → run:  ./scripts/termux.sh setup"; exit 1; }
    [ -d node_modules/vite ] || npm install --no-audit --no-fund
    is_termux && termux-wake-lock 2>/dev/null || true
    exec npm run dev
    ;;

  build)
    have node || { echo "Node missing → run:  ./scripts/termux.sh setup"; exit 1; }
    npm install --no-audit --no-fund
    npm run build
    say "Built. Run it with:  ./scripts/termux.sh start"
    ;;

  open)
    if is_termux && have termux-open-url; then
      termux-open-url "http://localhost:$PORT"
    else
      echo "open this in your phone browser:  http://localhost:$PORT"
    fi
    ;;

  size)
    if [ -d node_modules ]; then
      say "node_modules"
      du -sh node_modules
      printf 'files: %s\n' "$(find node_modules -type f | wc -l)"
    else
      echo "node_modules does not exist — that's the point 🙂  (run ./scripts/termux.sh start)"
    fi
    ;;

  *)
    sed -n '2,14p' "$0"
    exit 1
    ;;
esac
