import React, { useMemo, useState } from 'react';
import {
  Bike,
  BookOpen,
  Building2,
  CalendarDays,
  Camera,
  ChefHat,
  Coffee,
  Compass,
  CookingPot,
  Dumbbell,
  Fish,
  Flag,
  HandPlatter,
  Landmark,
  Library,
  Map,
  MapPin,
  Mountain,
  Music,
  Palette,
  PartyPopper,
  Soup,
  Sparkles,
  Store,
  Tent,
  Ticket,
  Trees,
  Utensils,
  UtensilsCrossed,
  Waves,
} from 'lucide-react';
import {
  SCENIC_NEARBY_ICON_IDS,
  assignNearbyIconSlots,
} from './scenicNearbyIconSlots.js';

const ICONS = {
  utensils: Utensils,
  'utensils-crossed': UtensilsCrossed,
  'chef-hat': ChefHat,
  'cooking-pot': CookingPot,
  'hand-platter': HandPlatter,
  store: Store,
  soup: Soup,
  coffee: Coffee,
  bike: Bike,
  waves: Waves,
  tent: Tent,
  fish: Fish,
  dumbbell: Dumbbell,
  mountain: Mountain,
  landmark: Landmark,
  book: BookOpen,
  palette: Palette,
  camera: Camera,
  library: Library,
  building: Building2,
  calendar: CalendarDays,
  sparkles: Sparkles,
  ticket: Ticket,
  music: Music,
  flag: Flag,
  party: PartyPopper,
  trees: Trees,
  map: Map,
  compass: Compass,
  pin: MapPin,
};

/** 아이콘마다 다른 바탕. 이웃 칸은 아이콘이 달라 바탕도 같이 갈린다. */
const WASH = {
  utensils: 'from-orange-100 to-amber-50 text-orange-800',
  'utensils-crossed': 'from-amber-100 to-orange-50 text-amber-900',
  'chef-hat': 'from-rose-100 to-orange-50 text-rose-800',
  'cooking-pot': 'from-orange-200 to-amber-50 text-orange-900',
  'hand-platter': 'from-stone-200 to-amber-50 text-stone-700',
  store: 'from-amber-200 to-stone-50 text-amber-950',
  soup: 'from-orange-50 to-rose-100 text-rose-900',
  coffee: 'from-yellow-100 to-amber-50 text-amber-950',
  bike: 'from-sky-100 to-stone-50 text-sky-800',
  waves: 'from-cyan-100 to-sky-50 text-cyan-800',
  tent: 'from-emerald-100 to-stone-50 text-emerald-800',
  fish: 'from-sky-200 to-cyan-50 text-sky-900',
  dumbbell: 'from-stone-200 to-sky-50 text-stone-700',
  mountain: 'from-emerald-50 to-stone-200 text-emerald-900',
  landmark: 'from-violet-100 to-stone-50 text-violet-800',
  book: 'from-stone-200 to-violet-50 text-stone-700',
  palette: 'from-fuchsia-100 to-violet-50 text-fuchsia-800',
  camera: 'from-stone-100 to-amber-100 text-stone-700',
  library: 'from-violet-50 to-stone-200 text-violet-900',
  building: 'from-stone-200 to-violet-100 text-violet-900',
  calendar: 'from-rose-100 to-amber-50 text-rose-800',
  sparkles: 'from-amber-100 to-rose-50 text-amber-900',
  ticket: 'from-orange-100 to-rose-50 text-orange-800',
  music: 'from-rose-50 to-amber-100 text-rose-900',
  flag: 'from-red-100 to-amber-50 text-red-800',
  party: 'from-amber-200 to-rose-50 text-amber-950',
  trees: 'from-green-100 to-stone-50 text-green-800',
  map: 'from-amber-50 to-stone-200 text-amber-900',
  compass: 'from-stone-100 to-amber-100 text-stone-800',
  pin: 'from-amber-100 to-orange-50 text-amber-900',
};

function NearbyIconTile({ iconId }) {
  const Icon = ICONS[iconId] || Utensils;
  const wash = WASH[iconId] || WASH.utensils;
  return (
    <span
      className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${wash}`}
      data-scenic-nearby-icon-tile=""
      data-scenic-nearby-icon={iconId}
      aria-hidden="true"
    >
      <span className="absolute -left-5 -top-6 h-16 w-16 rounded-full bg-white/40" />
      <span className="absolute -bottom-7 -right-6 h-20 w-20 rounded-full bg-white/30" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 shadow-sm">
        <Icon size={28} strokeWidth={1.75} />
      </span>
    </span>
  );
}

function NearbyCardPhoto({ urls, onExhaust }) {
  const [index, setIndex] = useState(0);
  const src = urls[index] || '';
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      data-scenic-nearby-photo=""
      onError={() => {
        if (index + 1 < urls.length) setIndex((i) => i + 1);
        else onExhaust?.();
      }}
    />
  );
}

/**
 * 명승 본문 주변 목록용 두 열 카드.
 * 사진이 있으면 사진을, 없으면 종류별 아이콘 타일을 같은 칸에 둔다.
 * @param {{
 *   variant: 'food' | 'leports' | 'culture' | 'festival' | 'attraction' | 'hub',
 *   ariaLabel?: string,
 *   items: Array<{
 *     key: string,
 *     title: string,
 *     meta?: string,
 *     distLabel?: string,
 *     thumbUrls?: string[],
 *     onActivate?: () => void,
 *     textProps?: Record<string, string>,
 *   }>,
 * }} props
 */
export default function ScenicNearbyCardGrid({ variant, ariaLabel, items }) {
  const [exhausted, setExhausted] = useState(() => new Set());
  const iconIds = SCENIC_NEARBY_ICON_IDS[variant] || SCENIC_NEARBY_ICON_IDS.attraction;
  const rows = items || [];

  const slots = useMemo(() => {
    const entries = rows.map((item) => ({
      key: item.key,
      hasPhoto:
        !exhausted.has(item.key) &&
        Array.isArray(item.thumbUrls) &&
        item.thumbUrls.length > 0,
    }));
    return assignNearbyIconSlots(entries, iconIds.length, 2);
  }, [rows, exhausted, iconIds.length]);

  if (!rows.length) return null;

  return (
    <ul
      className="grid grid-cols-2 items-stretch gap-2"
      aria-label={ariaLabel || undefined}
      data-scenic-nearby-cards=""
      data-scenic-nearby-variant={variant}
    >
      {rows.map((item, index) => {
        const showPhoto =
          !exhausted.has(item.key) &&
          Array.isArray(item.thumbUrls) &&
          item.thumbUrls.length > 0;
        const iconId = iconIds[slots[index]] || iconIds[0];
        const Tag = item.onActivate ? 'button' : 'div';
        const tagProps = item.onActivate
          ? { type: 'button', onClick: item.onActivate }
          : {};
        return (
          <li key={item.key || index} className="min-w-0">
            <Tag
              {...tagProps}
              className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition-colors [@media(hover:hover)]:hover:border-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90"
              data-scenic-nearby-card=""
            >
              <span className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-stone-100">
                {showPhoto ? (
                  <NearbyCardPhoto
                    urls={item.thumbUrls}
                    onExhaust={() => {
                      setExhausted((prev) => {
                        if (prev.has(item.key)) return prev;
                        const next = new Set(prev);
                        next.add(item.key);
                        return next;
                      });
                    }}
                  />
                ) : (
                  <NearbyIconTile iconId={iconId} />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-2.5 pb-2.5 pt-2">
                <span
                  className="text-[13px] font-bold leading-snug text-stone-900 line-clamp-2 break-keep"
                  {...(item.textProps || {})}
                >
                  {item.title}
                </span>
                {item.distLabel ? (
                  <span className="text-[11px] font-bold tabular-nums text-stone-600">
                    {item.distLabel}
                  </span>
                ) : null}
                {item.meta ? (
                  <span
                    className="text-[11px] leading-snug text-stone-500 line-clamp-2 break-keep"
                    {...(item.textProps || {})}
                  >
                    {item.meta}
                  </span>
                ) : null}
              </span>
            </Tag>
          </li>
        );
      })}
    </ul>
  );
}
