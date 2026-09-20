import { CATEGORY_LABELS } from '../pages/Home/components/SearchDiscovery/constants';

/** SSOT explore badge keys — BADGE_STYLES·localizedExploreBadgeLabel lookup */
export const EXPLORE_BADGE_PLACE = '장소';
export const EXPLORE_BADGE_REGION = '지역';

/**
 * @param {import('i18next').TFunction} t
 * @param {string} id
 * @param {string} labelKo
 */
export function localizedExploreContinentLabel(t, id, labelKo) {
  return t(`home.explore.continent.${id}`, { defaultValue: labelKo });
}

/**
 * @param {import('i18next').TFunction} t
 * @param {string} id
 * @param {string} labelKo
 */
export function localizedExploreThemeLabel(t, id, labelKo) {
  if (id === 'all') {
    return t('home.explore.theme.all', { defaultValue: labelKo });
  }
  return t(`home.category.${id}`, { defaultValue: labelKo });
}

/**
 * @param {import('i18next').TFunction} t
 * @param {string} [id]
 */
export function localizedExploreCategoryLabel(t, id) {
  const labelKo = CATEGORY_LABELS[id] || '기타';
  if (!id) return t('home.explore.categoryOther');
  return t(`home.category.${id}`, {
    defaultValue: labelKo === '기타' ? t('home.explore.categoryOther') : labelKo,
  });
}

/**
 * @param {import('i18next').TFunction} t
 * @param {string} badgeKo
 */
export function localizedExploreBadgeLabel(t, badgeKo) {
  const key = String(badgeKo || '장소').trim();
  return t(`home.explore.badge.${key}`, { defaultValue: key });
}

/**
 * @param {import('i18next').TFunction} t
 * @param {string} themeKey
 * @param {string} labelKo
 */
export function localizedPackageCtaLabel(t, themeKey, labelKo) {
  return t(`home.explore.packageCta.${themeKey}`, { defaultValue: labelKo });
}

/**
 * @param {import('i18next').TFunction} t
 */
export function localizedLeadingExplorePackage(t) {
  return {
    title: t('home.explore.leadingPackage.title'),
    subtitle: t('home.explore.leadingPackage.subtitle'),
    imageAlt: t('home.explore.leadingPackage.imageAlt'),
    badge: t('home.explore.leadingPackage.badge'),
    affiliateSource: t('home.explore.leadingPackage.affiliateSource'),
  };
}
