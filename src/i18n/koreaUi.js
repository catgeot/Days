/**
 * Korea festival / theme UI — time·taste chip labels (ids are SSOT).
 * @param {import('i18next').TFunction} t
 * @param {{ id: string, label: string }[]} tabs
 */
export function localizeFestivalTimeTabs(t, tabs) {
  return tabs.map((tab) => ({
    ...tab,
    label: t(`korea.festival.timeTab.${tab.id}`, { defaultValue: tab.label }),
  }));
}

/**
 * @param {import('i18next').TFunction} t
 * @param {{ id: string, label: string, count?: number }[]} chips
 */
export function localizeTasteChips(t, chips) {
  return chips.map((chip) => ({
    ...chip,
    label: t(`korea.festival.taste.${chip.id}`, { defaultValue: chip.label }),
  }));
}

/**
 * @param {import('i18next').TFunction} t
 * @param {string} tasteId
 * @param {string} [fallback]
 */
export function localizedTasteLabel(t, tasteId, fallback = '') {
  if (!tasteId || tasteId === 'all') return '';
  return t(`korea.festival.taste.${tasteId}`, { defaultValue: fallback });
}
