import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatFestivalDistKm } from '../lib/formatFestivalDistKm.js';
import { scrollFestivalNearbyBandIntoView } from '../lib/festivalNearbyBandScroll.js';
import {
  flattenNearbyDisplayGroups,
  groupFestivalNearbyBlocks,
  groupFestivalNearbyItems,
  nearbyBandCountsTotal,
  summarizeNearbyListItems,
} from '../lib/festivalNearbyDistanceGroups.js';
import FestivalNearbyPhotoCard, { nearbyCardThumbUrls } from './FestivalNearbyPhotoCard.jsx';

const BAND_KEYS = ['walk', 'drive', 'far'];

/**
 * @param {{
 *   sectionId: string,
 *   title: string,
 *   ariaLabel: string,
 *   variant: 'sights' | 'food',
 *   blocks?: Array<{ kind: string, spot?: object, title?: string, listId?: string, venueNote?: string }>,
 *   items?: object[],
 *   renderSpotMeta?: (spot: object) => { title: string, subtitleLines: string[], thumbUrls: string[], imagePending?: boolean, clickable?: boolean },
 *   onSpotActivate?: (spot: object) => void,
 *   headingAttr?: boolean,
 *   spotHasPhoto?: (spot: object) => boolean,
 * }} props
 */
export default function FestivalNearbyCardsSection({
  sectionId,
  title,
  ariaLabel,
  variant,
  blocks,
  items,
  renderSpotMeta,
  onSpotActivate,
  headingAttr = false,
  spotHasPhoto,
}) {
  const { t } = useTranslation();
  const [highlightBand, setHighlightBand] = useState(null);
  const sectionRootRef = useRef(null);

  const scrollToBand = useCallback((band) => {
    scrollFestivalNearbyBandIntoView(sectionRootRef.current, band);
  }, []);

  const bandSummaryLabels = useMemo(
    () => ({
      walk: t('korea.festival.detail.nearbyCardsBandWalk'),
      drive: t('korea.festival.detail.nearbyCardsBandDrive'),
      far: t('korea.festival.detail.nearbyCardsBandFar'),
      unknown: t('korea.festival.detail.nearbyCardsBandUnknown'),
    }),
    [t],
  );

  const bandGroupTitles = useMemo(
    () => ({
      walk: t('korea.festival.detail.nearbyCardsGroupWalk'),
      drive: t('korea.festival.detail.nearbyCardsGroupDrive'),
      far: t('korea.festival.detail.nearbyCardsGroupFar'),
      unknown: t('korea.festival.detail.nearbyCardsBandUnknown'),
    }),
    [t],
  );

  const displayGroups = useMemo(() => {
    if (blocks?.length) {
      return groupFestivalNearbyBlocks(blocks, bandGroupTitles, spotHasPhoto);
    }
    return groupFestivalNearbyItems(items || [], bandGroupTitles, spotHasPhoto);
  }, [blocks, items, bandGroupTitles, spotHasPhoto]);

  const flatItems = useMemo(() => flattenNearbyDisplayGroups(displayGroups), [displayGroups]);
  const summary = useMemo(() => summarizeNearbyListItems(flatItems), [flatItems]);

  if (!flatItems.length) return null;

  let photoCardIndex = 0;

  const closestLabel = formatFestivalDistKm(summary.closestDistKm);
  const bannerSubline =
    variant === 'food' && summary.closestName
      ? t('korea.festival.detail.nearbyCardsBannerFood', {
          count: summary.total,
          distance: closestLabel,
          name: summary.closestName,
        })
      : t('korea.festival.detail.nearbyCardsBanner', {
          count: summary.total,
          distance: closestLabel,
        });

  const bandActive = (band) => highlightBand === band;

  return (
    <div
      ref={sectionRootRef}
      className="w-full min-w-0 space-y-3 max-md:pb-[max(11.5rem,calc(env(safe-area-inset-bottom)+10.5rem))] md:pr-14 lg:pr-16 md:pb-[5.75rem]"
      data-nearby-cards-section=""
    >
      <div
        className="rounded-2xl bg-gradient-to-br from-amber-600 to-orange-500 px-4 py-3 text-white shadow-sm"
        data-nearby-banner=""
      >
        <p
          className="text-lg font-bold leading-snug break-keep"
          {...(headingAttr ? { 'data-nearby-heading': '' } : {})}
        >
          {title}
        </p>
        <p className="mt-1 text-sm font-medium text-white/95 tabular-nums break-keep">
          {bannerSubline}
        </p>
      </div>

      <div
        className="grid grid-cols-3 gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1"
        role="group"
        aria-label={t('korea.festival.detail.nearbyCardsSummaryAria')}
        data-nearby-summary=""
      >
        {BAND_KEYS.map((band) => {
          const count = summary.counts[band] || 0;
          const active = bandActive(band);
          return (
            <button
              key={band}
              type="button"
              data-nearby-summary-cell=""
              data-band={band}
              aria-pressed={active}
              disabled={count === 0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (count === 0) return;
                const willSelect = highlightBand !== band;
                setHighlightBand((prev) => (prev === band ? null : band));
                if (willSelect) {
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => scrollToBand(band));
                  });
                }
              }}
              className={`min-w-0 rounded-lg px-1 py-2 text-center transition-colors disabled:opacity-40 ${
                active
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-stone-800 [@media(hover:hover)]:hover:bg-amber-50'
              }`}
            >
              <span className="block text-[10px] font-semibold leading-tight break-keep">
                {bandSummaryLabels[band]}
              </span>
              <span className="mt-0.5 block text-sm font-bold tabular-nums">
                {t('korea.festival.detail.nearbyCardsBandCount', { count })}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4" aria-label={ariaLabel}>
        {displayGroups.map((group) => {
          const groupBand = group.kind === 'distance' ? group.band : null;
          const highlighted =
            highlightBand &&
            groupBand === highlightBand &&
            group.kind === 'distance';
          return (
            <section
              key={group.id}
              className={`space-y-2 ${highlighted ? 'rounded-xl ring-2 ring-amber-400/70 ring-offset-2' : ''}`}
              data-nearby-group-highlighted={highlighted ? 'true' : undefined}
              data-nearby-group=""
              data-band={groupBand || undefined}
              data-heading={group.kind === 'heading' ? 'true' : undefined}
            >
              <p
                className="inline-flex max-w-full scroll-mt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] rounded-full bg-stone-800 px-3 py-1 text-[11px] font-bold text-white break-keep"
                data-nearby-group-title=""
              >
                {group.title}
              </p>
              {group.kind === 'heading' && group.venueNote ? (
                <p
                  data-scenic-venue-note=""
                  className="text-[11px] leading-snug text-stone-500 break-keep whitespace-pre-line"
                >
                  {group.venueNote}
                </p>
              ) : null}
              <ul
                className="grid grid-cols-2 gap-2"
                data-nearby-cards-grid=""
              >
                {group.items.map((spot) => {
                  const meta = renderSpotMeta?.(spot) || {
                    title: String(spot?.name || ''),
                    subtitleLines: [],
                    thumbUrls: nearbyCardThumbUrls(spot),
                    imagePending: false,
                    clickable: false,
                  };
                  const key = spot.contentId || spot.id || meta.title;
                  const eagerImage = photoCardIndex < 4;
                  photoCardIndex += 1;
                  return (
                    <li key={key} className="min-w-0 list-none">
                      <FestivalNearbyPhotoCard
                        title={meta.title}
                        distKm={spot.distKm}
                        subtitleLines={meta.subtitleLines}
                        thumbUrls={meta.thumbUrls}
                        imagePending={meta.imagePending}
                        clickable={meta.clickable}
                        variant={variant}
                        eagerImage={eagerImage}
                        onActivate={() => onSpotActivate?.(spot)}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <span className="sr-only" data-nearby-band-total-check="">
        {nearbyBandCountsTotal(summary.counts)}
      </span>
    </div>
  );
}
