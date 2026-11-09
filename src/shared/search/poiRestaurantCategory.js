const FOOD_POI_ID_RE =
  /^(?:food_and_drink|restaurant|food|cafe|coffee_shop|coffee|bakery|bar|pub|wine_bar|brewery|fast_food|meal_(?:delivery|takeaway)|ice_cream|dessert|diner|brunch|steakhouse|pizza|sushi|ramen|noodle|seafood|barbecue|bbq|deli|tea_room|food_court)(?:$|[_/])/i;

const FOOD_POI_LABEL_RE =
  /\b(?:restaurant|food and drink|fast food|cafe|coffee shop|bakery|bar|pub|ramen|diner|brunch|pizzeria|sushi|noodle)\b/i;

function normCatToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
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
  if (group === 'FD6' || group === 'CE7') {
    out.push(group === 'FD6' ? 'food' : 'cafe');
  }
  const maki = String(item.maki || '').trim().toLowerCase();
  if (maki === 'restaurant' || maki === 'cafe' || maki === 'fast-food' || maki === 'bar') {
    out.push(maki.replace(/-/g, '_'));
  }
  return [...new Set(out.filter((t) => t.length >= 2))];
}

/**
 * @param {string[]} categories
 */
export function isPoiCategoryRestaurant(categories) {
  if (!categories?.length) return false;
  return categories.some((cat) => {
    const c = normCatToken(cat);
    if (!c) return false;
    if (FOOD_POI_ID_RE.test(c)) return true;
    if (FOOD_POI_LABEL_RE.test(c.replace(/_/g, ' '))) return true;
    if (c === 'food_and_drink' || c === 'restaurant' || c === 'cafe' || c === 'fast_food') return true;
    return false;
  });
}

/**
 * @param {object | null | undefined} item
 */
export function itemHasPoiRestaurantCategory(item) {
  return isPoiCategoryRestaurant(collectPoiCategoryTokens(item));
}
