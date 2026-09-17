#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="/home/fixsmith/vapefinder.fixsmith.store"
BARE_REPO="/home/fixsmith/vapefinder.git"
HOOK_FILE="$BARE_REPO/hooks/post-receive"

mkdir -p "$TARGET_DIR"
mkdir -p "$BARE_REPO"

if [ ! -d "$BARE_REPO/refs" ]; then
  git init --bare "$BARE_REPO"
fi

cat > "$HOOK_FILE" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="/home/fixsmith/vapefinder.fixsmith.store"
REPO_DIR="/home/fixsmith/vapefinder.git"

while read -r oldrev newrev refname; do
  branch="${refname#refs/heads/}"
  echo "Deploying branch: $branch"

  if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
    git --work-tree="$TARGET_DIR" --git-dir="$REPO_DIR" checkout -f "$branch"

    cd "$TARGET_DIR"
    if [ -f package.json ]; then
      npm install --production
    fi

    if [ -f cpanel-start.sh ]; then
      chmod +x cpanel-start.sh
    fi
  fi
done
EOF

chmod +x "$HOOK_FILE"

echo "Setup complete."
echo "Bare repo: $BARE_REPO"
echo "Deploy target: $TARGET_DIR"
echo ""
echo "Add this remote from your local repo:"
echo "git remote add cpanel ssh://fixsmith@your-server-host.com/home/fixsmith/vapefinder.git"
echo "git push cpanel main"
