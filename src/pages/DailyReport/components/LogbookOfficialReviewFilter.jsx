import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LOGBOOK_REVIEW_FILTER_MAJOR,
} from '../../../logbookOfficialReviews/groupLogbookOfficialReviews.js';
import { buildLogbookReviewCityChipLayout } from '../../../logbookOfficialReviews/logbookReviewCityChips.js';

function reviewFilterChipClass(active) {
  return `shrink-0 inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
    active
      ? 'border-indigo-200 bg-indigo-50 font-semibold text-indigo-700'
      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-700'
  }`;
}

function CityChipButton({ chip, active, onCityChange }) {
  const label = chip.shortPlaceName || chip.placeName || chip.slug;
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
      <span className="truncate">{label}</span>
      <span
        className={`text-[10px] tabular-nums ${active ? 'text-indigo-600/80' : 'text-gray-400'}`}
      >
        {chip.count}
      </span>
    </button>
  );
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
  const { t } = useTranslation();
  const [otherExpanded, setOtherExpanded] = useState(false);

  const majorOptions = [
    {
      id: LOGBOOK_REVIEW_FILTER_MAJOR.ALL,
      label: t('logbook.officialReviewHub.filter.all'),
      count: total,
      testId: 'logbook-review-filter-major-all',
    },
    {
      id: LOGBOOK_REVIEW_FILTER_MAJOR.DOMESTIC,
      label: t('logbook.officialReviewHub.filter.domestic'),
      count: domesticCount,
      testId: 'logbook-review-filter-major-domestic',
    },
    {
      id: LOGBOOK_REVIEW_FILTER_MAJOR.OVERSEAS,
      label: t('logbook.officialReviewHub.filter.overseas'),
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

  const { primary, overflow, overflowCount } = useMemo(
    () => buildLogbookReviewCityChipLayout(visibleCities, citySlug),
    [visibleCities, citySlug],
  );

  const otherLabel = t('logbook.officialReviewHub.filter.otherCities', { count: overflowCount });

  return (
    <div className="mb-3 space-y-2" data-testid="logbook-review-filter">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('logbook.officialReviewHub.filter.majorAria')}>
        {majorOptions.map((opt) => {
          const active = major === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={opt.testId}
              aria-pressed={active}
              className={reviewFilterChipClass(active)}
              onClick={() => {
                setOtherExpanded(false);
                onMajorChange(opt.id);
              }}
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
      {showCityRow && primary.length > 0 ? (
        <>
          <div
            className="flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label={t('logbook.officialReviewHub.filter.cityAria')}
            data-testid="logbook-review-filter-city-row"
          >
            {primary.map((chip) => (
              <CityChipButton
                key={chip.slug}
                chip={chip}
                active={citySlug === chip.slug}
                onCityChange={(slug) => {
                  setOtherExpanded(false);
                  onCityChange(slug);
                }}
              />
            ))}
            {overflowCount > 0 ? (
              <button
                type="button"
                data-testid="logbook-review-filter-other-cities"
                aria-pressed={otherExpanded}
                className={reviewFilterChipClass(otherExpanded)}
                onClick={() => setOtherExpanded((open) => !open)}
              >
                <span className="truncate">{otherLabel}</span>
              </button>
            ) : null}
          </div>
          {otherExpanded && overflow.length > 0 ? (
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={t('logbook.officialReviewHub.filter.otherCitiesAria')}
              data-testid="logbook-review-filter-city-overflow"
            >
              {overflow.map((chip) => (
                <CityChipButton
                  key={chip.slug}
                  chip={chip}
                  active={citySlug === chip.slug}
                  onCityChange={(slug) => {
                    onCityChange(slug);
                    setOtherExpanded(false);
                  }}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}