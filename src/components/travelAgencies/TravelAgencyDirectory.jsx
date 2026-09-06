import React from 'react';
import { ExternalLink, Building2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TRAVEL_AGENCIES, getTravelAgencyById } from '../../data/travelAgencies.js';
import { getTravelAgencyHomeUrl, resolveTravelAgencyOpenUrl } from '../../utils/travelAgencyHome.js';
import { recordTravelAgencyVisit } from '../../utils/travelAgencyVisits.js';
import { useTravelAgencyVisits } from '../../hooks/useTravelAgencyVisits.js';
import {
  getPartnerLinkRel,
  getPartnerLinkTarget,
} from '../PlaceCard/common/partnerNavigation.js';

function agencyDisplayName(agency, lang) {
  if (!agency) return '';
  return lang?.startsWith('en') ? agency.nameEn : agency.nameKo;
}

function formatVisitedAt(visitedAt, lang) {
  if (!visitedAt) return '';
  try {
    return new Intl.DateTimeFormat(lang?.startsWith('en') ? 'en' : 'ko', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(visitedAt));
  } catch {
    return '';
  }
}

const VARIANT = {
  panel: {
    wrap: 'space-y-4',
    heading: 'text-lg font-bold text-white flex items-center gap-2',
    headingIcon: 'text-blue-400',
    hint: 'text-[10px] text-gray-500 leading-relaxed break-keep px-1',
    list: 'space-y-2',
    row: 'w-full flex items-center gap-3 py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left',
    name: 'text-sm font-bold text-white truncate',
    meta: 'text-[10px] text-gray-400 truncate',
    kind: 'text-[9px] font-bold uppercase tracking-wider text-blue-300',
    remove: 'p-1.5 text-gray-500 hover:text-red-300 rounded-full hover:bg-white/5',
    catalogGrid: 'grid grid-cols-1 gap-2',
    sectionLabel: 'text-xs text-gray-500 font-bold uppercase tracking-widest px-1',
    clear: 'text-[10px] text-gray-500 hover:text-red-300',
  },
  explore: {
    wrap: 'space-y-3',
    heading: 'text-sm font-bold text-white flex items-center gap-2',
    headingIcon: 'text-blue-400',
    hint: 'text-[11px] text-gray-400 leading-relaxed break-keep',
    list: 'space-y-1.5',
    row: 'w-full flex items-center gap-2 py-2 px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-colors text-left',
    name: 'text-xs font-bold text-white truncate',
    meta: 'text-[10px] text-gray-400 truncate',
    kind: 'text-[9px] font-bold text-blue-300',
    remove: 'p-1 text-gray-500 hover:text-red-300 rounded-full',
    catalogGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-1.5',
    sectionLabel: 'text-[11px] text-gray-400',
    clear: 'text-[11px] text-gray-400 hover:text-red-300',
  },
  planner: {
    wrap: 'space-y-3',
    heading: 'text-sm md:text-base font-bold text-gray-900 flex items-center gap-2',
    headingIcon: 'text-blue-600',
    hint: 'text-xs text-gray-500 leading-relaxed break-keep',
    list: 'space-y-2',
    row: 'w-full flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 transition-colors text-left',
    name: 'text-sm font-bold text-gray-900 truncate',
    meta: 'text-[11px] text-gray-500 truncate',
    kind: 'text-[10px] font-bold text-blue-600',
    remove: 'p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100',
    catalogGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-2',
    sectionLabel: 'text-xs font-bold text-gray-500',
    clear: 'text-xs text-gray-500 hover:text-red-500',
  },
};

function AgencyRow({
  agency,
  href,
  kind,
  placeLabel,
  visitedAt,
  styles,
  t,
  lang,
  onRemove,
}) {
  const target = getPartnerLinkTarget();
  const rel = getPartnerLinkRel(target);
  const kindLabel = t(`home.agencies.kind.${kind || 'browse'}`, {
    defaultValue: t('home.agencies.kind.browse'),
  });
  const when = formatVisitedAt(visitedAt, lang);
  const metaParts = [placeLabel, when].filter(Boolean);

  const handleClick = () => {
    recordTravelAgencyVisit({ href, placeLabel, kind });
  };

  return (
    <div className="flex items-center gap-1">
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={handleClick}
        className={`${styles.row} min-w-0 flex-1`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={styles.name}>{agencyDisplayName(agency, lang)}</span>
            <span className={styles.kind}>{kindLabel}</span>
          </div>
          {metaParts.length > 0 ? (
            <p className={styles.meta}>{metaParts.join(' · ')}</p>
          ) : null}
        </div>
        <ExternalLink size={14} className="shrink-0 opacity-60" />
      </a>
      {onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(agency.id)}
          className={styles.remove}
          aria-label={t('home.agencies.removeVisit', { name: agencyDisplayName(agency, lang) })}
        >
          <X size={12} />
        </button>
      ) : null}
    </div>
  );
}

/**
 * @param {{ variant?: 'panel'|'explore'|'planner', className?: string }} props
 */
const TravelAgencyDirectory = ({ variant = 'panel', className = '' }) => {
  const { t, i18n } = useTranslation();
  const { visits, removeVisit, clearVisits } = useTravelAgencyVisits();
  const styles = VARIANT[variant] || VARIANT.panel;
  const lang = i18n.language;
  const visitedIds = new Set(visits.map((item) => item.agencyId));
  const catalog = TRAVEL_AGENCIES.filter((agency) => !visitedIds.has(agency.id));

  const catalogRows = catalog.map((agency) => {
    const href = getTravelAgencyHomeUrl(agency.id);
    if (!href) return null;
    return (
      <AgencyRow
        key={`catalog-${agency.id}`}
        agency={agency}
        href={href}
        kind={agency.kinds[0] || 'browse'}
        styles={styles}
        t={t}
        lang={lang}
      />
    );
  });

  return (
    <section className={`${styles.wrap} ${className}`.trim()} aria-label={t('home.agencies.title')}>
      <div className="flex items-end justify-between gap-2">
        <h3 className={styles.heading}>
          <Building2 size={16} className={styles.headingIcon} />
          {t('home.agencies.title')}
        </h3>
        {visits.length > 0 ? (
          <button type="button" onClick={clearVisits} className={styles.clear}>
            {t('home.agencies.clearVisits')}
          </button>
        ) : null}
      </div>
      <p className={styles.hint}>{t('home.agencies.hint')}</p>

      {visits.length > 0 ? (
        <div>
          <p className={`${styles.sectionLabel} mb-2`}>{t('home.agencies.visitedTitle')}</p>
          <div className={styles.list}>
            {visits.map((item) => {
              const agency = getTravelAgencyById(item.agencyId);
              if (!agency) return null;
              const href = resolveTravelAgencyOpenUrl(item.agencyId, item.href);
              if (!href) return null;
              return (
                <AgencyRow
                  key={`visit-${item.agencyId}`}
                  agency={agency}
                  href={href}
                  kind={item.kind}
                  placeLabel={item.placeLabel}
                  visitedAt={item.visitedAt}
                  styles={styles}
                  t={t}
                  lang={lang}
                  onRemove={removeVisit}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <p className={styles.hint}>{t('home.agencies.visitedEmpty')}</p>
      )}

      {variant === 'planner' ? (
        <details className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2">
          <summary className={`${styles.sectionLabel} cursor-pointer py-1`}>
            {t('home.agencies.catalogTitle')}
          </summary>
          <div className={`${styles.catalogGrid} mt-2 pb-1`}>{catalogRows}</div>
        </details>
      ) : (
        <div>
          <p className={`${styles.sectionLabel} mb-2`}>{t('home.agencies.catalogTitle')}</p>
          <div className={styles.catalogGrid}>{catalogRows}</div>
        </div>
      )}
    </section>
  );
};

export default TravelAgencyDirectory;
