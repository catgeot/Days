# CI — PR #373 r11 (`1e3ff916`)

## PR run (fix commit)

| Run | Result | Notes |
|-----|--------|--------|
| https://github.com/catgeot/Days/actions/runs/39914752445 | **failure** | `e2e-youtube-session` failed (~11m); `lint-and-build` **cancelled** after YouTube fail; Festival/Place E2E **skipped**. |

**Failure signature (same as r9–r10):** Playwright timeout on `getByRole('button', { name: '영상 더 보기' })` in `e2e/youtube-loadmore-session.spec.js:96` (`openPlaylist`), test 「close and reopen keeps load-more results」.

**Rerun:** `gh run rerun 39914752445 --failed` was attempted once from the Cloud agent → `Resource not accessible by integration` (no permission to rerun). No empty commits (limit already used on r9).

## `main` comparison

- Repo **CI** workflow (`/.github/workflows/ci.yml`) has **no** `workflow_dispatch` — cannot trigger a fresh full CI on `main` without a code push.
- Last **`main` CI push with green `e2e-youtube-session`** in recent history: https://github.com/catgeot/Days/actions/runs/39703417384 (2026-10-22) — all jobs success including YouTube.
- Recent `main` CI pushes after that are often **cancelled** (e.g. 39885251446), not the same Playwright timeout pattern.

**Conclusion:** PR failure is the known flaky YouTube playlist UI path, not the globe/home-fly diff. Globe-related jobs on the last complete PR runs were green when YouTube did not fail first.
