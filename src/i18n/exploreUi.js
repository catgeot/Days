import { CATEGORY_LABELS } from '../pages/Home/components/SearchDiscovery/constants';
import { getLocalizedParentCityLabel } from '../components/PlaceCard/common/locationDisplay.js';

/** SSOT explore badge keys — BADGE_STYLES·localizedExploreBadgeLabel lookup */
export const EXPLORE_BADGE_PLACE = '장소';
export const EXPLORE_BADGE_REGION = '지역';
export const EXPLORE_BADGE_FESTIVAL = '축제';
export const EXPLORE_BADGE_REVIEW = '리뷰';

/** Raw KO group header suffix in SSOT (`cityAttractionHubs`, `koreaPoiTypeSearch`). */
export const EXPLORE_GROUP_TITLE_ATTRACTIONS_SUFFIX = ' 명소';

/**
 * @param {string} [groupTitle]
 * @param {string} [locale]
 * @param {import('i18next').TFunction} [t]
 */
export function localizeExploreGroupTitle(groupTitle, locale = 'ko', t) {
  const raw = String(groupTitle || '').trim();
  if (!raw) return '';
  const koSuffix = EXPLORE_GROUP_TITLE_ATTRACTIONS_SUFFIX;
  if (raw.endsWith(koSuffix)) {
    const region = raw.slice(0, -koSuffix.length).trim();
    const localized = getLocalizedParentCityLabel(region, locale);
    const regionLabel = localized || region;
    if (String(locale || '').startsWith('en') && t) {
      const suffix = t('home.explore.groupTitleSightsSuffix', { defaultValue: ' sights' });
      return `${regionLabel}${suffix}`;
    }
    return localized ? `${localized}${koSuffix}` : raw;
  }
  return getLocalizedParentCityLabel(raw, locale) || raw;
}

/**
 * @param {string} [desc]
 * @param {string} [locale]
 * @param {import('i18next').TFunction} [t]
 * @param {string} [parentCityKo]
 */
export function localizeExploreSearchDesc(desc, locale = 'ko', t, parentCityKo) {
  const d = String(desc || '').trim();
  if (!d || !t) return d;
  const parent = String(parentCityKo || '').trim();
  if (parent && d === `${parent}의 명소·명물을 둘러보세요.`) {
    const name = getLocalizedParentCityLabel(parent, locale) || parent;
    return t('home.explore.hubBrowseBlurb', {
      name,
      defaultValue: d,
    });
  }
  return d;
}

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
  if (key === EXPLORE_BADGE_FESTIVAL) {
    return localizedExploreFestivalBadge(t);
  }
  if (key === EXPLORE_BADGE_REVIEW) {
    return t('home.explore.reviewBadge', { defaultValue: '리뷰' });
  }
  return t(`home.explore.badge.${key}`, { defaultValue: key });
}

/** Explore search — Korea festival row badge (singular EN; not korea.theme.festivalsLink). */
export function localizedExploreFestivalBadge(t) {
  return t('home.explore.festivalBadge', { defaultValue: '축제' });
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
