#!/usr/bin/env bash
# Vercel ignoreCommand: exit 0 skips the build, exit 1 builds.
# https://vercel.com/docs/project-configuration/vercel-json#ignorecommand
if [ "$VERCEL_ENV" = "production" ] || [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  exit 1
fi
case "$VERCEL_GIT_COMMIT_REF" in
  cursor/*) exit 0 ;;
esac
exit 1
