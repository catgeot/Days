import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { isExploreRestaurantItem } from '../../../shared/search/tourRestaurantDetect.js';
import { buildRestaurantMapSearchUrl } from '../../../shared/search/restaurantMapSearchUrl.js';
import { buildRestaurantMapOutboundCueCopy } from '../../../shared/search/restaurantMapProvider.js';

/**
 * 음식점 상세 — GATEO 본문 대신 외부 지도·리뷰 CTA.
 * @param {{ location?: object | null, className?: string }} props
 */
export default function PlaceRestaurantMapOutbound({ location = null, className = '' }) {
  const { t, i18n } = useTranslation();

  const href = useMemo(() => {
    if (!location || !isExploreRestaurantItem(location)) return '';
    return (
      String(location.restaurantMapSearchUrl || '').trim() ||
      buildRestaurantMapSearchUrl({ item: location, locale: i18n.language })
    );
  }, [location, i18n.language]);

  if (!href) return null;

  const { cta, aria, providerLabel } = buildRestaurantMapOutboundCueCopy(t, {
    item: location,
    name: location?.name,
    href,
  });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      className={`inline-flex w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-orange-400/45 bg-orange-500/15 px-4 py-3 text-sm font-bold text-orange-50 shadow-sm transition-colors hover:border-orange-300/70 hover:bg-orange-500/25 ${className}`}
    >
      <span className="inline-flex items-center gap-2">
        <ExternalLink size={16} aria-hidden="true" />
        <span>{cta}</span>
      </span>
      <span className="text-[11px] font-medium text-orange-100/75">{providerLabel}</span>
    </a>
  );
}
