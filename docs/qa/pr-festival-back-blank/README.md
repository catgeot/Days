# PR: 축제 «안내로 돌아가기» 빈 시트 / overview top

WebKit **390×844** (`iPhone 13`), `npm run build` + `vite preview` on `http://127.0.0.1:4173` with production `VITE_SUPABASE_*` (read-only anon).

## Festivals

| Slug | contentId | Notes |
|------|-----------|--------|
| `masan-637693` | 637693 | 마산가고파국화축제 |
| `gangneung-2930716` | 2930716 | 강릉 |
| `seoul-1998564` | 1998564 | 서울 |

함평 **638576** regression is covered in CI e2e (`hampyeong-638576`); no static PNG set in this folder.

## File naming

Per festival + sub-tab (`program` · `photos` · `reading`):

| Suffix | Meaning |
|--------|---------|
| `-before-back-bottom` | Sub-tab scrolled to bottom, «안내로 돌아가기» visible |
| `-after-back-momentum` | Immediately after tap (no settle wait) |
| `-after-back-settled` | ~450ms after tap |

Extra:

- `masan-637693-program-numbered-list.png` — 프로그램·내용 numbered items (`1.` … on own lines)

Legacy single-frame names (`*-program-before-back`, `*-overview-after-back`) are from an earlier capture pass; prefer the `*-before-back-bottom` / `*-after-back-settled` pair.

## Regenerate

```bash
npm run build
DEV_SSL=0 npm run preview -- --host 127.0.0.1 --port 4173
SMOKE_SITE_URL=http://127.0.0.1:4173/ npx playwright test e2e/pr-festival-back-blank-qa-capture.spec.js --project=webkit-festival-back-qa-capture
```

CI gate (no screenshots): `e2e/korea-festival-back-overview.spec.js` — job **Festival back to overview E2E (WebKit 390)** in `.github/workflows/ci.yml`.
