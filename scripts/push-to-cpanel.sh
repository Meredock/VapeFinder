#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME="cpanel"
BRANCH="main"
DRY_RUN=false
POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      ;;
    --remote)
      shift
      REMOTE_NAME="${1:-cpanel}"
      ;;
    --branch)
      shift
      BRANCH="${1:-main}"
      ;;
    *)
      POSITIONAL+=("$1")
      ;;
  esac
  shift
done

if (( ${#POSITIONAL[@]} > 0 )); then
  REMOTE_NAME="${POSITIONAL[0]}"
fi

if (( ${#POSITIONAL[@]} > 1 )); then
  BRANCH="${POSITIONAL[1]}"
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This is not a Git repo. Run from the project root."
  exit 1
fi

if ! git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  echo "Remote '$REMOTE_NAME' is not configured."
  echo "Add it with: git remote add $REMOTE_NAME ssh://user@host/path/to/public_html/vapefinder.git"
  if [[ "$DRY_RUN" == true ]]; then
    echo "Dry run only: no push was attempted."
    exit 0
  fi
  exit 1
fi

git add .
git commit -m "Deploy to cPanel" || true

if [[ "$DRY_RUN" == true ]]; then
  echo "Dry run: git push $REMOTE_NAME $BRANCH"
  exit 0
fi

git push "$REMOTE_NAME" "$BRANCH"
