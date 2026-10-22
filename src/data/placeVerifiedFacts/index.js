import {
  CAIRO_ATTRACTION_FACTS,
  CAIRO_CITY_FACTS,
  resolveVerifiedFacts as resolveCairoVerifiedFacts,
} from './cairo.js';
import {
  checkedAtForLocale as cairoCheckedAtForLocale,
  factValueForLocale as cairoFactValueForLocale,
  linkLabelForLocale as cairoLinkLabelForLocale,
  sourceNameForLocale as cairoSourceNameForLocale,
  splitFactTimeRanges,
  TIME_RANGE_CLASS,
} from './cairoEn.js';
import { isGateoLocalInfoRolloutEnabled } from '../../shared/gateoFeatureFlags.js';

function cardForLocale(card, locale) {
  const slots = (card.slots || []).map((slot) => {
    const sources = (slot.sources || []).map((source) => ({
      ...source,
      name: cairoSourceNameForLocale(source.name, locale),
    }));
    const source = slot.source
      ? { ...slot.source, name: cairoSourceNameForLocale(slot.source.name, locale) }
      : null;
    return {
      ...slot,
      value: cairoFactValueForLocale(card.slug, slot, locale),
      checkedAt: cairoCheckedAtForLocale(slot.checkedAt, locale),
      linkLabel: slot.linkLabel ? cairoLinkLabelForLocale(slot.linkLabel, locale) : null,
      sources,
      source,
    };
  });
  return {
    ...card,
    name: locale === 'en' ? (card.nameEn || card.name) : card.name,
    slots,
  };
}

/** slug -> {ko, en} card data. Cairo is the only entry. */
export const localInfoRegistry = {
  cairo: {
    ko: {
      city: CAIRO_CITY_FACTS,
      attractions: CAIRO_ATTRACTION_FACTS,
    },
    en: {
      city: cardForLocale(CAIRO_CITY_FACTS, 'en'),
      attractions: CAIRO_ATTRACTION_FACTS.map((card) => cardForLocale(card, 'en')),
    },
  },
};

const RESOLVERS = [
  { slug: 'cairo', pilot: true, resolve: resolveCairoVerifiedFacts },
];

/**
 * Cairo is the pilot and stays visible when the rollout flag is off.
 * Any later registry slug renders only when VITE_GATEO_LOCAL_INFO_ROLLOUT=1.
 */
export function resolveRegisteredCard(locationOrName, entries, rolloutEnabled) {
  for (const entry of entries) {
    const card = entry.resolve(locationOrName);
    if (!card) continue;
    if (entry.pilot !== true && rolloutEnabled !== true) return null;
    return card;
  }
  return null;
}

export function resolveVerifiedFacts(locationOrName) {
  return resolveRegisteredCard(
    locationOrName,
    RESOLVERS,
    isGateoLocalInfoRolloutEnabled(),
  );
}

export function factValueForLocale(slug, slot, locale) {
  return cairoFactValueForLocale(slug, slot, locale);
}

export function sourceNameForLocale(name, locale) {
  return cairoSourceNameForLocale(name, locale);
}

export function linkLabelForLocale(label, locale) {
  return cairoLinkLabelForLocale(label, locale);
}

export function checkedAtForLocale(checkedAt, locale) {
  return cairoCheckedAtForLocale(checkedAt, locale);
}

export { splitFactTimeRanges, TIME_RANGE_CLASS };
