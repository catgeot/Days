# Lightbox loaded-count evidence — PR #532

Real TourAPI data on a local production build of `cursor/festival-lightbox-loaded-0e70`. App source was not changed. The build under test is `d5795cfe` (the parent of the commit that adds this folder).

Playwright **WebKit**, `deviceScaleFactor: 1`, locales `ko-KR` / `Asia/Seoul`. Viewports are exactly **390×844** and **1280×800**. Each PNG is a viewport clip of that size.

## How it was served

`DEV_SSL=0 npx vite build`, then `DEV_SSL=0 npx vite preview --host 127.0.0.1 --port 4173`. The page is `http://127.0.0.1:4173/korea/`. Festival list and `detailImage` come from the production `tourapi-proxy` Edge function. No e2e fixtures and no mocked image bytes.

`vite build` does not set `VITE_GATEO_PREVIEW_DEBUG_CHROME`, so the localhost 「작업 로그」 / flight-debug chrome is not in this bundle.

## Path

Default time chip is **이번 달** (rolling 30 days from 2026-10-21). No season chip was needed.

1. `/korea/`
2. Region chip in 「세부 칩」
3. Festival card
4. Detail filmstrip with the hero badge `n/m` (loaded photos only)
5. Tap thumbnail **2** (the second loaded thumb)
6. Open 사진 확대보기. The badge and the lightbox text are the same numbers (`2/11` and `2 / 11`). The thumb `img` and the lightbox `img` are the same URL.
7. Sideways swipe (WebKit `touchstart` / `touchmove` / `touchend` on `[data-festival-lightbox-swipe]`, left, about 160px, not from the screen edge). The counter steps `2 / m` → `3 / m`. The URL stays `?festival=<id>` and the lightbox stays open.
8. Browser **Back** closes the lightbox. The detail sheet and `?festival=` stay.
9. Open again and tap **확대보기 닫기** (X). The detail sheet stays.

Pinned promo rows `638576` (함평) and `637693` (마산) sit at the top of every region list. The 강원 shot scrolls to `825295`. The 서울 shot skips those two rows and opens a card whose place line is 서울.

DOM checks for every flow are in `capture-results.json` (`countMatch`, `samePhoto`, `swipeStayed`, `detailAfterBack`, `detailAfterX` are all true).

| Viewport | Region | Festival | Thumb 2 → lightbox | After swipe |
|---|---|---|---|---|
| 390 and 1280 | 강원 | 강릉커피축제 `825295` | `2/11` = `2 / 11` | `3 / 11`, still on the detail |
| 390 and 1280 | 경남 | 마산가고파국화축제 `637693` | `2/11` = `2 / 11` | `3 / 11`, still on the detail |
| 390 and 1280 | 서울 | 페인터즈 `3481597` | `2/7` = `2 / 7` | `3 / 7`, still on the detail |

### File names

`{390|1280}-{gangwon-825295|gyeongnam-637693|seoul-3481597}-{step}.png`

| Step | Frame |
|---|---|
| `01-region` | Region chip selected |
| `02-card` | That festival's card in the filtered list |
| `03-filmstrip` | Detail open, hero badge and filmstrip visible |
| `04-thumb` | Second thumb selected (amber ring), badge `2/m` |
| `05-lightbox` | Lightbox `2 / m`, same photo as the thumb |
| `06-swipe` | After a left swipe, lightbox still open, count `3 / m` |
| `07-back` | Back closed the lightbox; the detail sheet is still open |
| `08-x` | X closed a reopened lightbox; the detail sheet is still open |

## Growing count while the same photo stays

`{390|1280}-grow-825295-2of2.png` and `{390|1280}-grow-825295-3of3.png`.

강릉커피축제 `825295`, same real path (강원 chip → card). Playwright `page.route` **held** cross-origin image responses and then called `route.continue()`. The bytes are the real VisitKorea responses. Nothing was drawn, replaced, or mocked.

The hold was armed before navigation, so gallery images could not decode early. When the hidden filmstrip probes had rendered, only probe URL 0 and probe URL 2 (API order) were released. The strip opened at 2 photos. The second thumb was opened in the lightbox (`2 / 2`). Probe URL 1, which sits between those two in the URL list, was then released. The counter became `3 / 3` and `data-festival-lightbox-index` became `2`. The lightbox `img` `src` did not change (`samePhoto: true` in `capture-results.json`). Every other gallery URL stayed held so the strip could not jump past 3.

The three unthrottled flows above did not use this hold.

## Original URL vs list URL

The filmstrip probe loads `resolveListImageUrl(url, { role: 'list' })` and, on decode, marks the **original** `url` loaded. The lightbox then sets `img.src` to that original URL (`lightboxSlides.urls`). If those strings differ, a list URL can count a photo the lightbox cannot paint.

Measured on real `detailImage` rows, using the same choice as the sheet (`imageUrl || originimgurl || smallimageurl || firstimage`, then `toHttps`):

- `festivalWindow` rolling 12 months, 339 festivals
- 24 festivals across 16 sido (서울, 인천, 대전, 대구, 부산, 울산, 세종, 경기, 강원, 충북, 충남, 경북, 경남, 전북, 전남, 제주), including `825295` and `637693`
- 192 photos (`detailImage` up to 12, plus a list `firstimage` only when it was not already in the gallery)
- WebKit `Image()` with `referrerPolicy=no-referrer`. Success means `naturalWidth > 0` within 15s. A URL that is identical for list and original was loaded once.

| | Count |
|---|---|
| Photos measured | 192 |
| List URL ≠ original URL | 0 |
| Both decoded | 192 |
| Both failed | 0 |
| List loads, original fails | **0** |
| Original-only failure rate | **0 / 192 = 0%** |

Every photo was already `https://tong.visitkorea.or.kr/...`. `resolveListImageUrl` rewrites only Unsplash query params (and upgrades `http` to `https`, which `toHttps` had already done). For this sample the probe and the lightbox request the same string, so an original-only failure cannot happen.

Threshold from review was **≥ 1%**. 0% is under that, so the lightbox was not changed and no new test was added.

If a later sample crosses 1%, the change is small: on the lightbox `FestivalPhotoFrame` `onFailed`, when `resolveListImageUrl(src) !== src`, show the list URL, and reset that override when the slide changes. One unit test in `scripts/health/festival-photo-frame.test.mjs`. Not done here.

Per-festival counts: `url-measure.json`.
