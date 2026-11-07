# e2e-youtube-session CI (PR #373 r10)

## PR head `2cab3600` (failed)

- https://github.com/catgeot/Days/actions/runs/39909119208 — **failure** on `e2e-youtube-session` only; lint + Festival E2E **green**.
- Same symptom as r9: Playwright timeout waiting for `getByRole('button', { name: '영상 더 보기' })` in `e2e/youtube-loadmore-session.spec.js:96` (`openPlaylist`), test **「close and reopen keeps load-more results」** (chromium-mobile + webkit-mobile). **8 passed / 2 failed** (~9.9m).

## `main` comparison

- Recent `main` **CI** pushes are mostly **cancelled** (e.g. runs 39885251446, 39882469469).
- Last **green** `main` CI push in the window checked: https://github.com/catgeot/Days/actions/runs/39703417384 (2026-10-22) — includes successful `e2e-youtube-session`.
- **Conclusion**: current PR failures match a **flaky / environment** YouTube playlist UI path, not the globe diff. No unrelated test changes in this PR.
