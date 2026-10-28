import React, { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, CalendarDays, Landmark, Sparkles } from 'lucide-react';
import { resolvePlaceCrossLinksIfEnabled } from '../../../pages/Home/lib/placeCrosslinkRollout.js';

export const PLACE_CROSSLINK_VISIBLE_ROW_CAP = 5;

/**
 * @param {{ location?: object | null, variant?: 'dark' | 'summary', className?: string, bucketFilter?: 'all' | 'eventsOnly' | 'festivalsCollections' }} props
 */
export default function PlaceCrossLinksSection({
  location = null,
  variant = 'dark',
  className = '',
  bucketFilter = 'all',
}) {
  const { t, i18n } = useTranslation();
  const panelFestivalsId = useId();
  const panelCollectionsId = useId();
  const panelEventsId = useId();
  const [festivalsOpen, setFestivalsOpen] = useState(true);
  const [collectionsOpen, setCollectionsOpen] = useState(true);
<<<<<<< HEAD
  const [eventsOpen, setEventsOpen] = useState(false);
=======
  const [eventsOpen, setEventsOpen] = useState(true);
  const [expandedBuckets, setExpandedBuckets] = useState(() => ({}));

  const placeKey = String(location?.slug || location?.id || location?.name || '')
    .trim()
    .toLowerCase();
>>>>>>> 73c5cf16 (feat(place): crosslink P1-6 — cap·더 보기/접기·장소 key 리셋 (플래그 OFF))

  const locale = i18n.language || 'ko';
  const bundle = useMemo(
    () => resolvePlaceCrossLinksIfEnabled(location, { locale }),
    [location, locale],
  );
  const festivals = bucketFilter === 'eventsOnly' ? [] : bundle.festivals || [];
  const collections = bucketFilter === 'eventsOnly' ? [] : bundle.collections || [];
  const events = bucketFilter === 'festivalsCollections' ? [] : bundle.events || [];
  if (!festivals.length && !collections.length && !events.length) return null;

  const isSummary = variant === 'summary';
  const shellClass = isSummary
    ? 'rounded-xl border border-white/15 bg-white/[0.06] backdrop-blur-md'
    : 'rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md';

  const sectionHeaderClass = isSummary
    ? 'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]'
    : 'flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]';

  const listClass = isSummary ? 'px-3 pb-3 pt-0 space-y-1.5' : 'px-4 pb-4 pt-0 space-y-2';

  const rowClass = isSummary
    ? 'flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2 text-[12px] text-gray-100 hover:border-violet-400/35 hover:bg-violet-500/10'
    : 'flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[13px] text-gray-100 hover:border-violet-400/35 hover:bg-violet-500/10';

  const renderBucket = (key, rows, open, setOpen, panelId, icon, titleKey) => {
    if (!rows.length) return null;
    const cap = PLACE_CROSSLINK_VISIBLE_ROW_CAP;
    const bucketExpanded = Boolean(expandedBuckets[key]);
    const visibleRows = bucketExpanded || rows.length <= cap ? rows : rows.slice(0, cap);
    const hiddenCount = rows.length - visibleRows.length;
    return (
      <div className={shellClass}>
        <button
          type="button"
          className={sectionHeaderClass}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          {icon}
          <span className={`min-w-0 flex-1 font-bold ${isSummary ? 'text-xs text-white' : 'text-sm text-white'}`}>
            {t(titleKey)}
          </span>
          <span className={`shrink-0 text-[10px] font-semibold ${isSummary ? 'text-white/50' : 'text-white/45'}`}>
            {t('place.crossLinks.count', { count: rows.length })}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-white/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {open ? (
          <ul id={panelId} className={`${listClass} list-none m-0`}>
            {visibleRows.map((row) => (
              <li key={row.id || row.href}>
                <Link to={row.href} className={`${rowClass} !items-start`} onClick={(e) => e.stopPropagation()}>
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug break-keep">{row.title}</span>
                    {row.dateLabel ? (
                      <span
                        className={`mt-0.5 block ${isSummary ? 'text-[10px]' : 'text-[11px]'} text-white/55`}
                      >
                        {row.dateLabel}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-white/40 mt-0.5" aria-hidden />
                </Link>
              </li>
            ))}
            {hiddenCount > 0 ? (
              <li>
                <button
                  type="button"
                  className={`${rowClass} w-full text-left text-violet-200/90`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpandedBuckets((prev) => ({ ...prev, [key]: true }));
                  }}
                >
                  {t('place.crossLinks.showMore', { count: hiddenCount })}
                </button>
              </li>
            ) : null}
            {bucketExpanded && rows.length > cap ? (
              <li>
                <button
                  type="button"
                  className={`${rowClass} w-full text-left text-white/60`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpandedBuckets((prev) => ({ ...prev, [key]: false }));
                  }}
                >
                  {t('place.crossLinks.showLess')}
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    );
  };

  return (
    <div
      key={placeKey || 'place-crosslinks'}
      className={`space-y-3 ${className}`.trim()}
      data-place-crosslinks=""
      aria-label={t('place.crossLinks.aria')}
    >
      {renderBucket(
        'events',
        events,
        eventsOpen,
        setEventsOpen,
        panelEventsId,
        <CalendarDays size={isSummary ? 15 : 16} className="shrink-0 text-amber-200" aria-hidden />,
        'place.crossLinks.eventsTitle',
      )}
      {renderBucket(
        'festivals',
        festivals,
        festivalsOpen,
        setFestivalsOpen,
        panelFestivalsId,
        <Landmark size={isSummary ? 15 : 16} className="shrink-0 text-fuchsia-300" aria-hidden />,
        'place.crossLinks.festivalsTitle',
      )}
      {renderBucket(
        'collections',
        collections,
        collectionsOpen,
        setCollectionsOpen,
        panelCollectionsId,
        <Sparkles size={isSummary ? 15 : 16} className="shrink-0 text-amber-300" aria-hidden />,
        'place.crossLinks.collectionsTitle',
      )}
    </div>
  );
}
