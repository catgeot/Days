import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { buildRestaurantMapOutboundCueCopy } from '../../../../shared/search/restaurantMapProvider.js';

/**
 * 탐색 식당 카드 — 외부 지도·리뷰 안내(동작은 카드 onClick).
 * @param {{ item?: object | null, name?: string, className?: string }} props
 */
export default function ExploreRestaurantMapOutboundCue({ item = null, name = '', className = '' }) {
  const { t } = useTranslation();
  const href = String(item?.restaurantMapSearchUrl || '').trim();

  const copy = useMemo(
    () =>
      buildRestaurantMapOutboundCueCopy(t, {
        item,
        name: name || item?.name,
        href,
      }),
    [t, item, name, href],
  );

  return (
    <p
      className={`mt-1 inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-orange-100/90 ${className}`}
      aria-hidden="true"
    >
      <span className="inline-flex items-center gap-1">
        <ExternalLink size={12} className="shrink-0" />
        <span>{copy.cta}</span>
      </span>
      <span className="text-[10px] font-normal text-orange-100/65">{copy.providerLabel}</span>
    </p>
  );
}

export { buildRestaurantMapOutboundCueCopy } from '../../../../shared/search/restaurantMapProvider.js';
