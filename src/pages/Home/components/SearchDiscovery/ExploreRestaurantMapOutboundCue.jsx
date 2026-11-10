import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { buildRestaurantMapSearchUrl } from '../../../../shared/search/restaurantMapSearchUrl.js';
import { buildRestaurantMapOutboundCueCopy } from '../../../../shared/search/restaurantMapProvider.js';

/**
 * 탐색 식당 카드 — 외부 지도·리뷰 링크(카드 본문 onClick과 분리 · stopPropagation).
 * @param {{ item?: object | null, name?: string, className?: string }} props
 */
export default function ExploreRestaurantMapOutboundCue({ item = null, name = '', className = '' }) {
  const { t } = useTranslation();
  const href = useMemo(() => {
    const preset = String(item?.restaurantMapSearchUrl || '').trim();
    if (preset) return preset;
    return buildRestaurantMapSearchUrl({ item, name: name || item?.name }) || '';
  }, [item, name]);

  const copy = useMemo(
    () =>
      buildRestaurantMapOutboundCueCopy(t, {
        item,
        name: name || item?.name,
        href,
      }),
    [t, item, name, href],
  );

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={copy.aria}
      onClick={(event) => event.stopPropagation()}
      className={`mt-1 inline-flex min-h-11 flex-wrap items-center gap-x-1.5 gap-y-0.5 py-1 text-[11px] font-medium text-orange-100/90 underline-offset-2 hover:underline ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        <ExternalLink size={12} className="shrink-0" aria-hidden="true" />
        <span>{copy.cta}</span>
      </span>
      <span className="text-[10px] font-normal text-orange-100/65">{copy.providerLabel}</span>
    </a>
  );
}

export { buildRestaurantMapOutboundCueCopy } from '../../../../shared/search/restaurantMapProvider.js';
