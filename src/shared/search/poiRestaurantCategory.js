const CONCRETE_RESTAURANT_TOKENS = new Set([
  'restaurant',
  'cafe',
  'coffee_shop',
  'coffee',
  'bakery',
  'bar',
  'pub',
  'wine_bar',
  'brewery',
  'fast_food',
  'meal_delivery',
  'meal_takeaway',
  'ice_cream',
  'dessert',
  'diner',
  'brunch',
  'steakhouse',
  'pizza',
  'sushi',
  'ramen',
  'noodle',
  'seafood',
  'barbecue',
  'bbq',
  'deli',
  'tea_room',
  'kakao_fd6',
]);

const BROAD_FOOD_ONLY_TOKENS = new Set(['food', 'food_court', 'food_and_drink']);

const TOURISM_POI_ID_RE =
  /^(?:tourist_attraction|landmark|monument|museum|park|historic_site|viewpoint|observation_tower|tower|temple|castle|palace|market|place_of_worship|beach|amusement_park|zoo|aquarium|gallery|art_gallery|heritage_site|national_park|nature_reserve|scenic|lighthouse|trail|stadium|arena|bridge|library|cultural_center|performing_arts|theme_park|visitor_center|archaeological_site|ruins|shrine|mosque|church|cathedral|fort|memorial|garden|waterfall|lake|mountain|volcano|island|camping|marina|harbor|pier|dock|airport|train_station|metro_station|bus_station|shopping_mall|department_store|attraction|outdoors)(?:$|[_/])/i;

const TOURISM_POI_LABEL_RE =
  /\b(?:tourist attraction|historic site|observation tower|landmark|viewpoint|theme park|national park|art gallery|place of worship)\b/i;

function normCatToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function isEphemeralSlugForGuard(slug) {
  if (!slug || typeof slug !== 'string') return true;
  const s = slug.trim();
  return (
    !s ||
    /^\d+$/.test(s) ||
    s.startsWith('search-') ||
    s.startsWith('loc-') ||
    s.startsWith('city-') ||
    s.startsWith('label-')
  );
}

/**
 * 허브·카탈로그·Tour 명소(12) — POI 카테고리로 식당 덮어쓰기 금지.
 * @param {object | null | undefined} item
 */
export function isCatalogOrHubExplorePlace(item) {
  if (!item || typeof item !== 'object') return false;
  const source = String(item?.source ?? '').toLowerCase();
  if (['ssot', 'hub', 'settlement', 'legacy-misheal', 'monthly-pick', 'local-scenic'].includes(source)) {
    return true;
  }
  const ct = String(
    item?.contentTypeId ?? item?.content_type_id ?? item?.contenttypeid ?? '',
  ).trim();
  if (ct && ct !== '39') {
    if (source === 'tourapi' || item?.contentId) return true;
  }
  const slug = String(item?.slug ?? item?.canonical_slug ?? '').trim().toLowerCase();
  if (slug && !isEphemeralSlugForGuard(slug)) {
    if (source === 'hub' || source === 'ssot' || source === 'settlement') return true;
    if (/^tour-\d+$/u.test(slug) && ct !== '39') return true;
  }
  return false;
}

/**
 * @param {object | null | undefined} item
 * @returns {string[]}
 */
export function collectPoiCategoryTokens(item) {
  if (!item || typeof item !== 'object') return [];
  const raw = [
    item.poi_category_ids,
    item.poi_category,
    item.poiCategoryIds,
    item.poiCategory,
    item.googleTypes,
    item.google_types,
    item.place_types,
    item.placeTypes,
    item.attractionKind,
  ];
  const out = [];
  for (const entry of raw) {
    if (Array.isArray(entry)) {
      for (const v of entry) out.push(normCatToken(v));
    } else if (entry != null && String(entry).trim()) {
      out.push(normCatToken(entry));
    }
  }
  const group = String(item.category_group_code || item.categoryGroupCode || '').trim().toUpperCase();
  if (group === 'FD6') out.push('kakao_fd6');
  if (group === 'CE7') out.push('cafe');
  const maki = String(item.maki || '').trim().toLowerCase();
  if (maki === 'restaurant' || maki === 'cafe' || maki === 'fast-food' || maki === 'bar') {
    out.push(maki.replace(/-/g, '_'));
  }
  return [...new Set(out.filter((t) => t.length >= 2))];
}

/**
 * @param {string[]} categories
 */
export function hasTourismPoiCategory(categories) {
  if (!categories?.length) return false;
  return categories.some((cat) => {
    const c = normCatToken(cat);
    if (!c) return false;
    if (TOURISM_POI_ID_RE.test(c)) return true;
    if (TOURISM_POI_LABEL_RE.test(c.replace(/_/g, ' '))) return true;
    return false;
  });
}

function isConcreteRestaurantToken(cat) {
  const c = normCatToken(cat);
  if (!c || BROAD_FOOD_ONLY_TOKENS.has(c)) return false;
  if (CONCRETE_RESTAURANT_TOKENS.has(c)) return true;
  return /^(?:restaurant|cafe|coffee_shop|bakery|fast_food|ramen|sushi|pizza|diner|brunch|steakhouse|noodle|seafood|barbecue|bbq|deli|tea_room)(?:$|[_/])/i.test(
    c,
  );
}

/**
 * @param {string[]} categories
 */
export function isPoiCategoryRestaurant(categories) {
  if (!categories?.length) return false;
  if (hasTourismPoiCategory(categories)) return false;
  const onlyBroadFood = categories.every((cat) => {
    const c = normCatToken(cat);
    return !c || BROAD_FOOD_ONLY_TOKENS.has(c);
  });
  if (onlyBroadFood) return false;
  return categories.some((cat) => isConcreteRestaurantToken(cat));
}

/**
 * @param {object | null | undefined} item
 */
export function itemAllowsPoiRestaurantCategory(item) {
  if (!item || typeof item !== 'object') return false;
  if (isCatalogOrHubExplorePlace(item)) return false;
  return true;
}

/**
 * @param {object | null | undefined} item
 */
export function itemHasPoiRestaurantCategory(item) {
  if (!itemAllowsPoiRestaurantCategory(item)) return false;
  return isPoiCategoryRestaurant(collectPoiCategoryTokens(item));
}
