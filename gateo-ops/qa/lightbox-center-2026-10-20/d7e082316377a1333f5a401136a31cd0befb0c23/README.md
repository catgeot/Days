# Lightbox vertical center — real data

Code under test: `d7e082316377a1333f5a401136a31cd0befb0c23`

WebKit, `deviceScaleFactor: 1`, open state only. Local Vite against the production TourAPI proxy (no fixtures). Path: `/korea/?festival=<id>` → 사진 확대보기.

The dev-only 「모바일 위젯 로그」 chip (`z-[9990]`) was hidden before the shot so it does not cover the lightbox.

| File | Festival | Photo | Layout |
|---|---|---|---|
| `390-gangneung-coffee-825295-open.png` | 강릉커피축제 `825295` | 940×627 landscape, `1 / 11` | Painted middle and both 44px arrows at stage y=450. Arrows sit on the photo's side edges. |
| `1280-gangneung-coffee-825295-open.png` | 강릉커피축제 `825295` | 940×627 landscape, `1 / 11` | Same vertical middle. Prev button ends at x=108, photo stage starts at x=128, so the arrows sit outside the image. |
| `390-portrait-4127746-open.png` | 남산 야간 트래킹 `4127746` | 444×627 portrait poster | Painted middle at stage y=450. One photo, so no prev/next. |
| `1280-portrait-4127746-open.png` | 남산 야간 트래킹 `4127746` | 444×627 portrait poster | Poster fills the stage height and stays horizontally centered inside the inset photo column. |

Counter and close stay on the top row.
