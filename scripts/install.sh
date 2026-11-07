#!/usr/bin/env bash
# First-time setup on macOS or Linux: Engine dependencies, the GLiNER model, the Extension.
# Run from anywhere: ./scripts/install.sh   Safe to run again; it skips what is done.
set -euo pipefail

cd "$(dirname "$0")/.."

step() { printf '\n==> %s\n' "$1"; }
fail() { printf '\nError: %s\n' "$1" >&2; exit 1; }

step "Checking tools"
if ! command -v uv >/dev/null 2>&1; then
  echo "uv not found. Installing it with the official installer (https://docs.astral.sh/uv/)."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
  command -v uv >/dev/null 2>&1 || fail "uv was installed but is not on PATH. Open a new terminal and run this script again."
fi
command -v node >/dev/null 2>&1 || fail "Node.js not found. Install Node 22 or newer from https://nodejs.org and run this script again."
node_major="$(node -p 'process.versions.node.split(".")[0]')"
[ "$node_major" -ge 22 ] || fail "Node $node_major found, but the Extension needs Node 22 or newer."
echo "uv $(uv --version | cut -d' ' -f2), Node $(node --version)"

step "Engine: Python dependencies"
(cd engine && uv sync)

step "Engine: GLiNER model (about 600 MB, downloaded once)"
(cd engine && uv run python scripts/fetch_gliner.py)

step "Extension: npm packages"
(cd extension && npm install)

step "Checking the Engine"
(cd engine && uv run pytest -q)

cat <<'DONE'

Done. Start the Engine and the Extension together with:

  make start

Or separately: (cd engine && uv run ghost-engine) and (cd extension && npm run dev).
DONE
