/** 선택 필터 칩·내 주변(채움) — white on amber-700 (~5:1), not amber-500 (~2.14:1). */
export const KOREA_FILTER_CHIP_ACTIVE_FILL =
  'bg-amber-700 text-white border-amber-700';

export const KOREA_FILTER_CHIP_ACTIVE =
  `${KOREA_FILTER_CHIP_ACTIVE_FILL} font-bold shadow-sm`;

export const KOREA_FILTER_CHIP_IDLE =
  'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300';

/** Tailwind amber-700 fill — used to wait for paint after class swap (no color transition). */
export const KOREA_FILTER_CHIP_ACTIVE_BG_RGB = 'rgb(180, 83, 9)';

/** Detail filter chips (time / region / theme rows on /korea). */
export function koreaFilterChipClass(active) {
  return `flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs border shrink-0 transition-none ${
    active ? KOREA_FILTER_CHIP_ACTIVE : KOREA_FILTER_CHIP_IDLE
  }`;
}

export const KOREA_NEAR_ME_FILLED_ACTIVE =
  'border-amber-700 bg-amber-700 text-white hover:bg-amber-800';

export const KOREA_NEAR_ME_FILLED_IDLE =
  'border-amber-500/40 bg-amber-700 text-white hover:bg-amber-800';

/** Muted count on idle chips; full opacity on active fill for AA (white on amber-700). */
export function koreaFilterChipCountClass(active, extra = '') {
  const muted = active ? '' : 'opacity-70';
  return [muted, extra].filter(Boolean).join(' ');
}
