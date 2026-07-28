#!/usr/bin/env bash
#
#   gh-pages.sh publish <source-dir> <destination>   destination "." is the site root
#   gh-pages.sh remove  <destination>
#
# GitHub Pages serves one site per repository, so production and every PR
# preview share the gh-pages branch: production at the root, previews under
# pr-<N>/. A publish therefore has to leave the other's files alone, which is
# why this is explicit git - the publish actions either wipe the whole branch or
# keep every stale file forever. Callers serialise via a shared concurrency
# group so pushes cannot race.
set -euo pipefail

readonly BRANCH="gh-pages"
readonly TEMP_ROOT="$(mktemp -d)"
readonly WORKTREE="$TEMP_ROOT/$BRANCH"

# passed per-command rather than written with `git config`, which would rewrite
# the identity of whatever repository this runs in
readonly BOT_NAME="github-actions[bot]"
readonly BOT_EMAIL="41898282+github-actions[bot]@users.noreply.github.com"

usage() {
  echo "usage: gh-pages.sh publish <source-dir> <destination> | remove <destination>" >&2
  exit 1
}

action="${1:-}"
case "$action" in
  publish)
    source_dir="${2:-}"
    destination="${3:-}"
    [ -d "${source_dir:-}" ] && [ -n "$destination" ] || usage
    ;;
  remove)
    destination="${2:-}"
    [ -n "$destination" ] || usage
    [ "$destination" = "." ] && {
      echo "refusing to remove the site root" >&2
      exit 1
    }
    ;;
  *) usage ;;
esac

cleanup() {
  git worktree remove --force "$WORKTREE" 2>/dev/null || true
  rm -rf "$TEMP_ROOT"
}
trap cleanup EXIT

# an explicit refspec: actions/checkout narrows remote.origin.fetch to the one
# branch it checked out, so a plain `git fetch origin gh-pages` can succeed
# without ever creating refs/remotes/origin/gh-pages
if git fetch --depth=1 origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH" 2>/dev/null; then
  git worktree add --force -B "$BRANCH" "$WORKTREE" "origin/$BRANCH"
else
  echo "no $BRANCH branch yet - creating it"
  git worktree add --force --detach "$WORKTREE"
  git -C "$WORKTREE" checkout --orphan "$BRANCH"
  git -C "$WORKTREE" rm -rf . >/dev/null 2>&1 || true
fi

if [ "$action" = "publish" ]; then
  if [ "$destination" = "." ]; then
    # CNAME is how GitHub records a custom domain for a branch-published site;
    # removing it unsets the domain
    find "$WORKTREE" -mindepth 1 -maxdepth 1 \
      ! -name '.git' ! -name 'pr-*' ! -name 'CNAME' -exec rm -rf {} +
    cp -r "$source_dir"/. "$WORKTREE/"
  else
    rm -rf "${WORKTREE:?}/$destination"
    mkdir -p "$WORKTREE/$destination"
    cp -r "$source_dir"/. "$WORKTREE/$destination/"
  fi

  # Pages runs the output through Jekyll otherwise, which drops _-prefixed files
  touch "$WORKTREE/.nojekyll"
  message="deploy: $destination from ${GITHUB_SHA:-local}"
else
  rm -rf "${WORKTREE:?}/$destination"
  message="cleanup: remove $destination"
fi

git -C "$WORKTREE" add --all
if git -C "$WORKTREE" diff --cached --quiet; then
  echo "nothing to publish"
  exit 0
fi

git -C "$WORKTREE" \
  -c "user.name=$BOT_NAME" \
  -c "user.email=$BOT_EMAIL" \
  commit -m "$message"
git -C "$WORKTREE" push origin "HEAD:$BRANCH"
