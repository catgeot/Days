import { supabase } from './supabase';

const DEFAULT_TTL_MS = 7 * 60 * 1000;

/** @type {Map<string, { expires: number, value: unknown }>} */
const resultCache = new Map();
/** @type {Map<string, Promise<{ data: unknown, error: unknown }>>} */
const inflight = new Map();

function stableSerialize(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
    .join(',')}}`;
}

function cacheKey(functionName, body) {
  return `${functionName}|${stableSerialize(body ?? {})}`;
}

/**
 * Deduped supabase.functions.invoke — identical function+body shares one in-flight Promise
 * and a short session cache (default 7 min).
 *
 * @param {string} functionName
 * @param {{ body?: Record<string, unknown>, ttlMs?: number }} [opts]
 */
export async function invokeSupabaseFunctionDeduped(functionName, opts = {}) {
  const body = opts.body ?? {};
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const key = cacheKey(functionName, body);

  const cached = resultCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return { data: cached.value, error: null };
  }
  if (cached) resultCache.delete(key);

  const pending = inflight.get(key);
  if (pending) return pending;

  const job = supabase.functions
    .invoke(functionName, { body })
    .then((result) => {
      if (!result.error) {
        resultCache.set(key, { expires: Date.now() + ttlMs, value: result.data });
      }
      return result;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, job);
  return job;
}
