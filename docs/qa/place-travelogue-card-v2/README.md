# Place travelogue card v2 — QA captures

Broken images across the original card/article captures: **0**.

WebKit 390×844, `deviceScaleFactor: 1`, `VITE_GATEO_PLACE_TRAVELOGUE_CARD=1`, production data read-only. Path for place shots: home → search → open the place. Image requests were not mocked or intercepted.

| File | Step |
| --- | --- |
| rio-01-place-overview.png | Rio place overview |
| rio-02-travelogue-card.png | travelogue card, thumbnail loaded |
| rio-03-travelogue-open.png | travelogue body rendered |
| bangkok-01-search.png | Bangkok search screen (renamed; this frame is not the place page) |
| bangkok-01-place-overview.png | Bangkok place page, scrollTop 0, before scrolling the card into view |
| bangkok-02-travelogue-card.png | travelogue card, thumbnail loaded |
| bangkok-03-travelogue-open.png | travelogue body rendered |
| jeju-01-search.png | Jeju search screen (renamed; this frame is not the place page) |
| jeju-01-place-overview.png | Jeju place page, scrollTop 0, before scrolling the card into view |
| jeju-02-travelogue-card.png | travelogue card, thumbnail loaded |
| jeju-04-no-wrong-region.png | Jeju card slug is `jeju-travelogue` only |
| jeju-03-travelogue-open.png | travelogue body rendered |
| cairo-01-no-visit-story-overlap.png | Cairo visit stories without a duplicate travelogue card row |

`bangkok-01-place-overview.png` and `jeju-01-place-overview.png` were taken after `/place/bangkok` and `/place/jeju` loaded, `[data-search-popover]` was gone, and the place header showed 방콕 / 제주. The place scroller `scrollTop` was 0. The card is already inside the first viewport (top about 332px on Bangkok, 357px on Jeju) because the overview copy is short. The capture did not call `scrollIntoView` on the card.

## Location-name fallback

Queries were the live fallback (`fetchEditorialTraveloguesByLocationName`, anchored `location ILIKE` patterns, editorial + published only) and a broader public read `location ILIKE %name%` on non-deleted public `reports`. Both were read-only against production.

No row in production has location `신제주` or a phrase such as `제주 환승 후 오사카`. Those examples are not in the candidate set.

| Place | Query | id | place_slug | location | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Jeju | anchored `제주` | 67 | jeju | 제주 | accepted | `place_slug` is `jeju` and location is the place token `제주` |
| Jeju | anchored `Jeju` | — | — | — | no rows | English location name is not stored on any published editorial |
| Jeju | loose `ILIKE %제주%` | 67 | jeju | 제주 | accepted | same row as the anchored query; no other public report contains `제주` |
| Bangkok | anchored `방콕` | 63 | bangkok | 방콕 | accepted | `place_slug` is `bangkok` and location is the place token `방콕` |
| Bangkok | anchored `Bangkok` | — | — | — | no rows | English location name is not stored on any published editorial |
| Bangkok | loose `ILIKE %방콕%` | 63 | bangkok | 방콕 | accepted | same row; no other public report contains `방콕` |
| Rio | anchored `리우데자네이루` | 69 | rio-de-janeiro | 리우데자네이루 | accepted | `place_slug` is `rio-de-janeiro` and location is the place token |
| Rio | anchored `Rio de Janeiro` | — | — | — | no rows | English location name is not stored on any published editorial |
| Rio | loose `ILIKE %리우%` | 69 | rio-de-janeiro | 리우데자네이루 | accepted | same row; no other public report contains `리우` |

## Book-icon thumbnail fallback

No 390 WebKit shot of the book icon was saved. Producing one would have required mocking or intercepting the image request, which was not done.

What was checked, read-only, on production:

- All 7 published editorials (ids 63–69). None has a null or empty `images` array.
- All 55 image URLs on those rows. Each GET returned HTTP 200, `Content-Type` `image/*`, and a body larger than 500 bytes (Referer `http://127.0.0.1:5173/`).
- The latest 21 public, non-deleted `reports` rows. Each has a non-empty http(s) first image. Anon RLS does not expose further public rows.
- WebKit on the Bangkok and Jeju place pages, same path as the overview shots. The card thumbnail attribute was `data-place-travelogue-thumb="image"`, not `fallback`.

There is no published travelogue or visible public report in production whose thumbnail is missing or dead, so the book-icon state does not occur on a real user path.
