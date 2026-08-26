import { supabase } from '../shared/api/supabase';

/**
 * @param {string} eventId
 * @returns {Promise<{ guide: import('../../scripts/lib/event-travel-guide-schema.mjs').EventTravelGuide | null, raw: object | null, updatedAt: string | null }>}
 */
export async function fetchEventTravelGuide(eventId) {
  const key = String(eventId || '').trim();
  if (!key) {
    return { guide: null, raw: null, updatedAt: null };
  }

  const { data, error } = await supabase
    .from('event_travel_guide')
    .select('guide, guide_updated_at, schema_version, model')
    .eq('event_id', key)
    .maybeSingle();

  if (error) {
    console.warn('[fetchEventTravelGuide]', error.message);
    return { guide: null, raw: null, updatedAt: null };
  }

  if (!data?.guide || typeof data.guide !== 'object') {
    return { guide: null, raw: null, updatedAt: data?.guide_updated_at ?? null };
  }

  return {
    guide: data.guide,
    raw: data,
    updatedAt: data.guide_updated_at ?? null,
  };
}

/**
 * @param {string} eventId
 * @param {Record<string, unknown>} facts Tier0 facts blob
 * @param {{ locale?: string, force?: boolean }} [opts]
 */
export async function invokeEventTravelGuide(eventId, facts, opts = {}) {
  const { data, error } = await supabase.functions.invoke('update-event-travel-guide', {
    body: {
      facts,
      locale: opts.locale || 'ko',
      force: Boolean(opts.force),
    },
  });

  if (error) {
    throw error;
  }
  if (!data?.success) {
    throw new Error(data?.error || 'update-event-travel-guide failed');
  }

  return data;
}
