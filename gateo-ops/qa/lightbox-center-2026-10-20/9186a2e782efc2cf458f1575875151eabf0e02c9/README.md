# Lightbox back stack — real path

Code under test: `9186a2e782efc2cf458f1575875151eabf0e02c9`

WebKit 390×844, `deviceScaleFactor: 1`, `hasTouch`, locale `ko-KR`. Local Vite against the production TourAPI proxy (no fixtures). The dev-only 「모바일 위젯 로그」 chip was hidden before each shot.

Path: `/korea/` → tap 강원 → tap the 강릉커피축제 card (`825295`, no direct `?festival=` URL) → 사진 확대보기 → `goBack` → `goBack`.

| File | Step |
|---|---|
| `01-list.png` | `/korea/` list |
| `02-gangwon.png` | 강원 chip selected, 강릉커피축제 card visible |
| `03-sheet.png` | Detail sheet opened from the card |
| `04-lightbox.png` | Photo expanded |
| `05-back-detail.png` | One back: lightbox closed, detail still open |
| `06-back-list.png` | Second back: list, 강원 chip still selected |

Same run, no extra shots: Esc then one back returns to the list; a tap on the black letterbox then one back returns to the list; three 다음 사진 taps then one back closes only the lightbox.
