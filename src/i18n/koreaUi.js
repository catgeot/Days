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

const THEME_MODULE_PATH_KEYS = {
  '/korea': 'festival',
  '/korea/theme': 'scenic',
  '/korea/theme/top10': 'top10',
  '/korea/theme/scenic': 'scenic',
  '/korea/theme/courses': 'courses',
  '/korea/theme/regions': 'regions',
  '/korea/theme/packages': 'packages',
};

const DRILL_LEVEL_KEY_BY_KO = {
  '불러오는 중…': 'korea.theme.map.level.loading',
  '대분류(권역)': 'korea.theme.map.level.regionMajor',
  '중분류(시도)': 'korea.theme.map.level.provinceMid',
  '중분류(세권)': 'korea.theme.map.level.clusterMid',
  '소분류(여행지)': 'korea.theme.map.level.hubMinor',
  '소분류(경관)': 'korea.theme.map.level.landscapeMinor',
  '종목 대분류': 'korea.theme.map.level.catMajor',
  '종목 중분류': 'korea.theme.map.level.catMid',
  '종목 소분류': 'korea.theme.map.level.catMinor',
  명소: 'korea.theme.map.level.curated',
  명승: 'korea.theme.map.level.heritage',
  관광지: 'korea.theme.map.level.tour',
};

/**
 * @param {import('i18next').TFunction} t
 * @param {string} path
 */
export function localizedThemeModuleLabel(t, path) {
  const pathname = String(path || '').split('?')[0];
  const key = THEME_MODULE_PATH_KEYS[pathname] || 'theme';
  return t(`korea.theme.nav.module.${key}`);
}

/**
 * @param {import('i18next').TFunction} t
 * @param {string} label
 */
export function localizedDrillLevelLabel(t, label) {
  const key = DRILL_LEVEL_KEY_BY_KO[String(label || '').trim()];
  return key ? t(key) : label;
}

/**
 * @param {import('i18next').TFunction} t
 * @param {{ path?: string, label?: string, moduleLabel?: string } | null | undefined} entry
 */
export function formatLocalizedThemeNavBackLabel(t, entry) {
  if (!entry) return '';
  const name = String(entry.label || '').trim();
  const mod = localizedThemeModuleLabel(t, entry.path);
  if (name && mod) return `${name} · ${mod}`;
  return name || mod || '';
}
