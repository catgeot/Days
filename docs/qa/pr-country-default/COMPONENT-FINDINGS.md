# Free-search / globe-label simple card — component findings

Captured against `https://127.0.0.1:4173/` (390px WebKit).

## Summary

Overseas free-search / explore picks open the **home overlay** (`HomePlaceCardSummary` → `PlaceCardSummary`), not the `/place/:slug` route shell.

- **Component path**: `src/pages/Home/components/HomePlaceCardSummary.jsx` renders `src/components/PlaceCard/modes/PlaceCardSummary.jsx`.
- **DOM hooks**: `.place-summary-card`, `[data-summary-chrome]` on the summary chrome row.
- **`PlaceCardExpanded` / `PlaceMobileSecondaryNav`**: **not mounted** on this path (no `유튜브 영상` secondary tab). Those appear on `/place/...` via `src/components/PlaceCard/index.jsx` → `PlaceCardExpanded` → `PlaceMediaPanel` / `PlaceChatPanel`.
- **Search popover**: `SearchSuggestionList` inside explore UI; list rows live under `[data-search-popover]`.

## Per-place DOM snapshot

| slug | route | summary card | data-summary-chrome | PlaceCardExpanded chrome | 유튜브 영상 tab | country line |
|------|-------|--------------|---------------------|--------------------------|-----------------|--------------|
| romblon | / | true | true | false | false | 필리핀 |
| pamir | / | true | true | false | false | 타지키스탄 |
| sao-tome-and-principe | / | true | true | false | false | 상투메 프린시페 |
| tinian | / | true | true | false | false | 북마리아나 제도 |

## Raw JSON

```json
[
  {
    "slug": "romblon",
    "queries": [
      "롬블론",
      "Romblon"
    ],
    "hasPlaceSummaryCard": true,
    "hasDataSummaryChrome": true,
    "hasPlaceCardExpandedChrome": false,
    "hasYoutubeSecondaryTab": false,
    "summaryClassSample": "place-summary-card relative z-[1] border border-white/10 rounded-3xl shadow-2xl group max-md:bg-[#0a0a0a] max-md:backdro",
    "visiblePlaceName": null,
    "countryLine": "필리핀",
    "searchPopoverAttr": null,
    "routePath": "/"
  },
  {
    "slug": "pamir",
    "queries": [
      "파미르 고원",
      "파미르",
      "Pamir"
    ],
    "hasPlaceSummaryCard": true,
    "hasDataSummaryChrome": true,
    "hasPlaceCardExpandedChrome": false,
    "hasYoutubeSecondaryTab": false,
    "summaryClassSample": "place-summary-card relative z-[1] border border-white/10 rounded-3xl shadow-2xl group max-md:bg-[#0a0a0a] max-md:backdro",
    "visiblePlaceName": null,
    "countryLine": "타지키스탄",
    "searchPopoverAttr": null,
    "routePath": "/"
  },
  {
    "slug": "sao-tome-and-principe",
    "queries": [
      "상투메 프린시페",
      "상투메",
      "Sao Tome"
    ],
    "hasPlaceSummaryCard": true,
    "hasDataSummaryChrome": true,
    "hasPlaceCardExpandedChrome": false,
    "hasYoutubeSecondaryTab": false,
    "summaryClassSample": "place-summary-card relative z-[1] border border-white/10 rounded-3xl shadow-2xl group max-md:bg-[#0a0a0a] max-md:backdro",
    "visiblePlaceName": null,
    "countryLine": "상투메 프린시페",
    "searchPopoverAttr": null,
    "routePath": "/"
  },
  {
    "slug": "tinian",
    "queries": [
      "티니안",
      "Tinian"
    ],
    "hasPlaceSummaryCard": true,
    "hasDataSummaryChrome": true,
    "hasPlaceCardExpandedChrome": false,
    "hasYoutubeSecondaryTab": false,
    "summaryClassSample": "place-summary-card relative z-[1] border border-white/10 rounded-3xl shadow-2xl group max-md:bg-[#0a0a0a] max-md:backdro",
    "visiblePlaceName": null,
    "countryLine": "북마리아나 제도",
    "searchPopoverAttr": null,
    "routePath": "/"
  }
]
```
