# Lightbox QA — PR #530

Code under test: `13f35b64900342918e84d2486c6c2039d9a7f8ba`

WebKit, touch, `deviceScaleFactor: 1`. Real festival list from the production TourAPI proxy (no fixtures). Path: `/korea/` → region chip → festival row → expand photo.

390×844: 강릉커피축제 (강원), 페인터즈 (서울), 서귀포칠십리축제 (제주). 1280×844: 강릉커피축제 only. Promo/pinned rows were skipped so the extra festivals come from the region list.

Item 6 on `1535bf14` did not return the button: `elementFromPoint` hit the icon (`path` / `svg`). This SHA sets `pointer-events-none` on those icons. The shots below are the recapture.

Broken images = `img` with a src, `complete`, and `naturalWidth === 0`. Incomplete lazy/probe images are listed as pending and are not counted as broken. No image response was HTTP 4xx/5xx.

| Run | 1 open | 2 next | 3 prev | 4 swipe | 5 close | 6 targets | broken |
|---|---|---|---|---|---|---|---|
| 390 강릉커피축제 `825295` | PASS | PASS 0→1 | PASS 1→0 | PASS | PASS | PASS 44×44 button | 0 |
| 390 서울 페인터즈 `3481597` | PASS | PASS 0→1 | PASS 1→0 | PASS | PASS | PASS 44×44 button | 0 |
| 390 제주 서귀포칠십리축제 `506616` | PASS | PASS 0→1 | PASS 1→0 | PASS | PASS | PASS 44×44 button | 0 |
| 1280 강릉커피축제 `825295` | PASS | PASS 0→1 | PASS 1→0 | PASS | PASS | PASS 44×44 button | 0 |

## Item 4 — right swipe

`location.href` stayed on the festival URL. Filmstrip `scrollLeft` and `window.scrollY` did not change during the gesture. The swipe also moved to the previous photo (wrap).

| Run | href | scrollLeft | scrollY | index |
|---|---|---|---|---|
| 390 강릉 | `…/korea/?festival=825295` | 120 throughout | 0 throughout | 0→10 |
| 390 서울 | `…/korea/?festival=3481597` | 84 throughout | 0 throughout | 0→6 |
| 390 제주 | `…/korea/?festival=506616` | 120 throughout | 0 throughout | 0→7 |
| 1280 강릉 | `…/korea/?festival=825295` | 120 throughout | 0 throughout | 0→10 |

## Item 5 — close

`window.scrollY` after X equals the value taken just before expand: 0 → 0 on every run.

## Item 6 — hit targets

`getBoundingClientRect` is 44×44 for 확대보기 닫기, 이전 사진, and 다음 사진. `document.elementFromPoint` at each center returns that `button` (`exact: true`).

## Broken images

| Run | list | detail | lightbox |
|---|---|---|---|
| 390 강릉 | 0 broken, 0 pending | 0 broken, 41 pending | 0 broken, 41 pending |
| 390 서울 | 0 broken, 19 pending | 0 broken, 52 pending | 0 broken, 52 pending |
| 390 제주 | 0 broken, 0 pending | 0 broken, 47 pending | 0 broken, 47 pending |
| 1280 강릉 | 0 broken, 0 pending | 0 broken, 41 pending | 0 broken, 41 pending |

Pending images had not fired load/error yet (lazy thumbs and hidden gallery probes behind the sheet). None of the completed images were broken, and the lightbox photo decoded (`naturalWidth > 10`) on every run.
