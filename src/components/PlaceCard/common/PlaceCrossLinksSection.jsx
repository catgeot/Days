import React, { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Landmark, Sparkles } from 'lucide-react';
import { resolvePlaceCrossLinksIfEnabled } from '../../../pages/Home/lib/placeCrosslinkRollout.js';

/**
 * @param {{ location?: object | null, variant?: 'dark' | 'summary', className?: string }} props
 */
export default function PlaceCrossLinksSection({
  location = null,
  variant = 'dark',
  className = '',
}) {
  const { t } = useTranslation();
  const panelFestivalsId = useId();
  const panelCollectionsId = useId();
  const [festivalsOpen, setFestivalsOpen] = useState(true);
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  const bundle = useMemo(() => resolvePlaceCrossLinksIfEnabled(location), [location]);
  const festivals = bundle.festivals || [];
  const collections = bundle.collections || [];
  if (!festivals.length && !collections.length) return null;

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
            {rows.map((row) => (
              <li key={row.id || row.href}>
                <Link to={row.href} className={rowClass} onClick={(e) => e.stopPropagation()}>
                  <span className="min-w-0 flex-1 leading-snug break-keep">{row.title}</span>
                  <ChevronRight size={14} className="shrink-0 text-white/40" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className={`space-y-3 ${className}`.trim()}
      data-place-crosslinks=""
      aria-label={t('place.crossLinks.aria')}
    >
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
