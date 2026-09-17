#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="${1:-cpanel}"
BRANCH="${2:-main}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This is not a Git repo. Run from the project root."
  exit 1
fi

git add .
git commit -m "Deploy to cPanel" || true
git push "$REMOTE_NAME" "$BRANCH"
