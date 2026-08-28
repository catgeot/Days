import { supabase } from '../shared/api/supabase';

const INVOKE_TIMEOUT_MS = 15_000;

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 */
function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * @param {{
 *   eventId: string,
 *   termId: string,
 *   prompt: string,
 *   locale?: string,
 * }} opts
 * @returns {Promise<{ ok: boolean, answer: string, fromCache?: boolean, error?: string }>}
 */
export async function fetchEventTermExplanation(opts) {
  const eventId = String(opts?.eventId ?? '').trim();
  const termId = String(opts?.termId ?? '').trim();
  const prompt = String(opts?.prompt ?? '').trim();
  const locale = String(opts?.locale ?? 'ko').trim() === 'en' ? 'en' : 'ko';

  if (!eventId || !termId || !prompt) {
    return { ok: false, answer: '', error: 'eventId, termId, prompt required' };
  }

  try {
    const { data: cached } = await supabase
      .from('event_term_glossary_cache')
      .select('answer')
      .eq('event_id', eventId)
      .eq('term_id', termId)
      .eq('locale', locale)
      .maybeSingle();

    if (cached?.answer) {
      return { ok: true, answer: String(cached.answer), fromCache: true };
    }

    const { data, error } = await withTimeout(
      supabase.functions.invoke('explain-event-term', {
        body: { eventId, termId, prompt, locale },
      }),
      INVOKE_TIMEOUT_MS,
      'explain-event-term',
    );

    if (error) {
      console.warn('[fetchEventTermExplanation] invoke error:', error.message || error);
      return { ok: false, answer: '', error: error.message || 'invoke failed' };
    }

    if (!data?.success || !data?.answer) {
      return { ok: false, answer: '', error: data?.error || 'explain failed' };
    }

    return { ok: true, answer: String(data.answer), fromCache: Boolean(data.fromCache) };
  } catch (err) {
    console.warn('[fetchEventTermExplanation] failed:', err?.message || err);
    return { ok: false, answer: '', error: err?.message || 'failed' };
  }
}
