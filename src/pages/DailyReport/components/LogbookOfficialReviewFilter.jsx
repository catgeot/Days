import React from 'react';
import {
  LOGBOOK_REVIEW_FILTER_MAJOR,
} from '../../../logbookOfficialReviews/groupLogbookOfficialReviews.js';

function reviewFilterChipClass(active) {
  return `shrink-0 inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
    active
      ? 'border-indigo-200 bg-indigo-50 font-semibold text-indigo-700'
      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-700'
  }`;
}

export default function LogbookOfficialReviewFilter({
  major,
  citySlug,
  total,
  domesticCount,
  overseasCount,
  cityChips,
  onMajorChange,
  onCityChange,
}) {
  const majorOptions = [
    {
      id: LOGBOOK_REVIEW_FILTER_MAJOR.ALL,
      label: '전체',
      count: total,
      testId: 'logbook-review-filter-major-all',
    },
    {
      id: LOGBOOK_REVIEW_FILTER_MAJOR.DOMESTIC,
      label: '국내',
      count: domesticCount,
      testId: 'logbook-review-filter-major-domestic',
    },
    {
      id: LOGBOOK_REVIEW_FILTER_MAJOR.OVERSEAS,
      label: '해외',
      count: overseasCount,
      testId: 'logbook-review-filter-major-overseas',
    },
  ];

  const showCityRow =
    major === LOGBOOK_REVIEW_FILTER_MAJOR.DOMESTIC ||
    major === LOGBOOK_REVIEW_FILTER_MAJOR.OVERSEAS;

  const visibleCities = showCityRow
    ? cityChips.filter((c) =>
        major === LOGBOOK_REVIEW_FILTER_MAJOR.DOMESTIC ? c.domestic : !c.domestic,
      )
    : [];

  return (
    <div className="mb-3 space-y-2" data-testid="logbook-review-filter">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="리뷰 대분류"
      >
        {majorOptions.map((opt) => {
          const active = major === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={opt.testId}
              aria-pressed={active}
              className={reviewFilterChipClass(active)}
              onClick={() => onMajorChange(opt.id)}
            >
              <span>{opt.label}</span>
              <span
                className={`text-[10px] tabular-nums ${active ? 'text-indigo-600/80' : 'text-gray-400'}`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>
      {showCityRow && visibleCities.length > 0 ? (
        <div
          className="flex gap-2 overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="리뷰 도시"
        >
          {visibleCities.map((chip) => {
            const active = citySlug === chip.slug;
            return (
              <button
                key={chip.slug}
                type="button"
                data-testid={`logbook-review-filter-city-${chip.slug}`}
                aria-pressed={active}
                title={chip.placeName}
                className={reviewFilterChipClass(active)}
                onClick={() => onCityChange(active ? '' : chip.slug)}
              >
                <span className="truncate">{chip.placeName}</span>
                <span
                  className={`text-[10px] tabular-nums ${active ? 'text-indigo-600/80' : 'text-gray-400'}`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
