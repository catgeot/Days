/** sRGB tuples for MOONi ChatModal sidebar + close button WCAG health checks. */

export const MOONI_CHAT_CLOSE = {
  testId: 'mooni-chat-close',
  minTapPx: 44,
};

/** Main chat header — reserve top-right close tap target + inset (all breakpoints). */
export const MOONI_CHAT_MAIN_HEADER_RESERVE_CLASS =
  'max-md:pr-[calc(2.75rem+0.75rem+env(safe-area-inset-right,0px)+0.25rem)] md:pr-[calc(2.75rem+1rem+0.25rem)]';

/** @typedef {{ panel: number[]; itemBg: number[]; title: number[]; meta: number[]; personaBg: number[]; personaText: number[]; delete: number[]; activeBg: number[]; activeTitle: number[]; hoverBg: number[]; disabledMeta: number[] }} SidebarTone */

/** @type {Record<'mooni' | 'travel', SidebarTone>} */
export const MOONI_CHAT_SIDEBAR_TONES = {
  mooni: {
    panel: [255, 255, 255],
    itemBg: [255, 255, 255],
    hoverBg: [240, 249, 255],
    activeBg: [236, 254, 255],
    title: [30, 41, 59],
    activeTitle: [15, 23, 42],
    meta: [71, 85, 105],
    disabledMeta: [100, 116, 139],
    personaBg: [226, 232, 240],
    personaText: [51, 65, 85],
    delete: [100, 116, 139],
  },
  travel: {
    panel: [17, 24, 39],
    itemBg: [31, 41, 55],
    hoverBg: [31, 41, 55],
    activeBg: [31, 41, 55],
    title: [229, 231, 235],
    activeTitle: [243, 244, 246],
    meta: [156, 163, 175],
    disabledMeta: [156, 163, 175],
    personaBg: [75, 85, 99],
    personaText: [229, 231, 235],
    delete: [156, 163, 175],
  },
};

/** Close button (MOONi light modal chrome). */
export const MOONI_CHAT_CLOSE_COLORS = {
  mooni: { bg: [14, 116, 144], icon: [255, 255, 255], panel: [240, 249, 255] },
  travel: { bg: [107, 114, 128], icon: [255, 255, 255], panel: [17, 24, 39] },
};