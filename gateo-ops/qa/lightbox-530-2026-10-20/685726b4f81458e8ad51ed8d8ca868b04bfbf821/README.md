# Lightbox open — PR #530 review

Code: `685726b4f81458e8ad51ed8d8ca868b04bfbf821`

WebKit, touch, `deviceScaleFactor: 1`. Production TourAPI. 강릉커피축제 `825295`, lightbox just opened.

| File | Viewport | Scrim | Arrows |
|---|---|---|---|
| `390-gangneung-coffee-1-open.png` | 390×844 | `rgba(0, 0, 0, 0.92)` | 44×44, overlaid at the stage edges (390 layout) |
| `1280-gangneung-coffee-1-open.png` | 1280×844 | `rgba(0, 0, 0, 0.92)` | 44×44, outside the poster (prev ends at x=108, image starts at x=128) |

E2E: `e2e/festival-lightbox-ios.spec.js` WebKit 390 passed after this change.

«모바일 위젯 로그» is not in the production bundle. See `isPreviewDebugChromeBundled` and `vite.config.js` (`VITE_GATEO_PREVIEW_DEBUG_CHROME` only when `VERCEL_ENV === 'preview'`). The 1280 dev shot can still show that badge because the capture used the Vite dev server.
