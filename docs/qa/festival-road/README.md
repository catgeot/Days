# Festival road map — QA captures (off-repo)

WebKit screenshots and console captures for PR #542 QA rounds (r3–r10) are **not** stored in git (keeps the PR diff reviewable).

- **Latest validated round**: r10 (head before slim) — Wonju 390 week-next / stop-expand map resize fix.
- **Capture scripts**: removed from the branch; re-run locally from release tags or agent artifact store if needed.
- **CI**: `scripts/health/festival-road.test.mjs` + `e2e/korea-festival-road-wonju-390.spec.js` (job: Festival road Wonju E2E).

**Ops archive (full tree, paths preserved):** `/opt/cursor/artifacts/festival-road-qa-archive/` — 300 files from pre-slim commit (`docs/qa/festival-road-*`, `scripts/capture-festival-road-*.mjs`). Copy into your ops QA folder.

Per-round Cloud runs may also have `/opt/cursor/artifacts/festival-road-qa-r10/` etc.
