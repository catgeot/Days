# Lightbox scrim — opaque black

Code: `1113cb3d907224f7bb60b0aa91ad4748394b2df0`

WebKit, touch, production TourAPI, 강릉커피축제 `825295`, lightbox just opened.

## Root cause

The 0.92 scrim was on the full-viewport portal (`position: fixed`, `z-index: 80`, child of `body`). At (195, 600) `elementFromPoint` hit the lightbox photo frame, not the sheet. Ancestors: transparent swipe layer → lightbox root `background: rgba(0, 0, 0, 0.92)` covering 390×844 → `body`. Sheet z-index is 40 (parent) / 10 (dialog), below the portal. The sheet was not painted on top.

`rgba(0,0,0,0.92)` still mixes 8% of the white sheet. That left luminance about 20 where the title sits, so the title, rows, and green button stayed faintly visible. This build uses `#000` on the viewport layer and a full-bleed scrim element.

## Pixels (luminance 0.2126R+0.7152G+0.0722B)

| Point | 390 | 1280 |
|---|---|---|
| (195, 600) title area | `(0,0,0)` L=0 | — |
| (1100, 500) right of poster | — | `(0,0,0)` L=0 |
| (1180, 620) right of poster | — | `(0,0,0)` L=0 |
| Band below the photo, arrows excluded | L min/p50/max 0/0/0 except the dev-only «모바일 위젯 로그» chip near y=760 | Right gutter x=1100–1260, arrow row excluded: L 0/0/0 |

E2E `e2e/festival-lightbox-ios.spec.js` WebKit 390 passed.
