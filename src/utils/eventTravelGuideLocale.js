/**
 * EventTravelGuide fixture/DB row — optional parallel `*_en` arrays for Preview pilot.
 * @param {Record<string, unknown> | null | undefined} guide
 * @param {string} [locale]
 */
export function localizeEventTravelGuide(guide, locale = 'ko') {
  if (!guide || typeof guide !== 'object' || locale !== 'en') return guide;

  const pickArray = (koKey, enKey) => {
    const en = guide[enKey];
    if (Array.isArray(en) && en.length > 0) return en;
    return guide[koKey];
  };

  return {
    ...guide,
    trip_presets: pickArray('trip_presets', 'trip_presets_en'),
    sections: pickArray('sections', 'sections_en'),
    booking_tips: pickArray('booking_tips', 'booking_tips_en'),
    cautions: pickArray('cautions', 'cautions_en'),
  };
}
