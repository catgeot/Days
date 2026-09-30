/**
 * 홈 TravelTicker — Open-Meteo 현재 날씨 (API 키 불필요, sessionStorage 30분 캐시)
 * @see https://open-meteo.com/en/docs
 */

const CACHE_KEY_PREFIX = 'gateo_ticker_weather_v1:';
const FAILURE_KEY_PREFIX = 'gateo_ticker_weather_fail_v1:';
const GLOBAL_FAILURE_KEY = 'gateo_ticker_weather_fail_global_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;
const FAILURE_BACKOFF_MS = 45 * 60 * 1000;
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

const globalFailureUntil = { at: 0 };

function isGlobalFailureActive() {
  if (globalFailureUntil.at && Date.now() < globalFailureUntil.at) return true;
  try {
    const raw = sessionStorage.getItem(GLOBAL_FAILURE_KEY);
    if (!raw) return false;
    const entry = JSON.parse(raw);
    if (!entry?.until || Date.now() >= entry.until) return false;
    globalFailureUntil.at = entry.until;
    return true;
  } catch {
    return false;
  }
}

function markGlobalFailure() {
  const until = Date.now() + FAILURE_BACKOFF_MS;
  globalFailureUntil.at = until;
  try {
    sessionStorage.setItem(GLOBAL_FAILURE_KEY, JSON.stringify({ until }));
  } catch {
    // quota / private mode
  }
}

function failureCacheKey(lat, lng) {
  return `${FAILURE_KEY_PREFIX}${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function readFailureBackoff(lat, lng) {
  try {
    const raw = sessionStorage.getItem(failureCacheKey(lat, lng));
    if (!raw) return false;
    const entry = JSON.parse(raw);
    return entry?.until && Date.now() < entry.until;
  } catch {
    return false;
  }
}

function writeFailureBackoff(lat, lng) {
  try {
    sessionStorage.setItem(
      failureCacheKey(lat, lng),
      JSON.stringify({ until: Date.now() + FAILURE_BACKOFF_MS }),
    );
  } catch {
    // quota / private mode
  }
}

export const TICKER_WEATHER_FALLBACK = { temp: 20, weather: 'cloud' };

/** @typedef {'sun' | 'cloud' | 'rain' | 'wind'} TickerWeatherType */

/**
 * WMO weather_code → TravelTicker 아이콘 타입
 * @param {number} code
 * @param {number} [windSpeedKmh]
 * @returns {TickerWeatherType}
 */
export function mapWmoToTickerWeather(code, windSpeedKmh = 0) {
  if (windSpeedKmh >= 35 && code <= 3) return 'wind';

  if (code === 0) return 'sun';
  if (code === 1 || code === 2) return 'sun';
  if (code === 3 || code === 45 || code === 48) return 'cloud';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'cloud';
  if (code >= 80 && code <= 86) return 'rain';
  if (code >= 95 && code <= 99) return 'rain';
  return 'cloud';
}

function cacheKey(lat, lng) {
  return `${CACHE_KEY_PREFIX}${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function readCache(lat, lng) {
  try {
    const raw = sessionStorage.getItem(cacheKey(lat, lng));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry?.at || Date.now() - entry.at > CACHE_TTL_MS) return null;
    return { temp: entry.temp, weather: entry.weather };
  } catch {
    return null;
  }
}

function writeCache(lat, lng, payload) {
  try {
    sessionStorage.setItem(
      cacheKey(lat, lng),
      JSON.stringify({ ...payload, at: Date.now() }),
    );
  } catch {
    // quota / private mode
  }
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ temp: number, weather: TickerWeatherType } | null>}
 */
export async function fetchTickerWeatherForCoords(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const cached = readCache(lat, lng);
  if (cached) return cached;

  if (isGlobalFailureActive() || readFailureBackoff(lat, lng)) return null;

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,weather_code,wind_speed_10m',
    timezone: 'auto',
  });

  const res = await fetch(`${OPEN_METEO_URL}?${params}`);
  if (!res.ok) {
    writeFailureBackoff(lat, lng);
    if (res.status === 429) markGlobalFailure();
    return null;
  }

  const data = await res.json();
  const current = data?.current;
  if (!current || typeof current.temperature_2m !== 'number') return null;

  const payload = {
    temp: Math.round(current.temperature_2m),
    weather: mapWmoToTickerWeather(
      current.weather_code ?? 3,
      current.wind_speed_10m ?? 0,
    ),
  };

  writeCache(lat, lng, payload);
  return payload;
}

/**
 * @param {Array<{ lat?: number, lng?: number, temp?: number, weather?: string }>} spots
 * @returns {Promise<typeof spots>}
 */
export async function enrichTickerSpotsWithWeather(spots) {
  if (!spots?.length) return spots;

  const results = await Promise.allSettled(
    spots.map(async (spot) => {
      const lat = spot.lat;
      const lng = spot.lng;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return {
          ...spot,
          temp: spot.temp ?? TICKER_WEATHER_FALLBACK.temp,
          weather: spot.weather ?? TICKER_WEATHER_FALLBACK.weather,
        };
      }

      try {
        const live = await fetchTickerWeatherForCoords(lat, lng);
        if (live) {
          return { ...spot, temp: live.temp, weather: live.weather };
        }
      } catch {
        // network — keep existing or fallback below
      }

      return {
        ...spot,
        temp: spot.temp ?? TICKER_WEATHER_FALLBACK.temp,
        weather: spot.weather ?? TICKER_WEATHER_FALLBACK.weather,
      };
    }),
  );

  return results.map((result, index) =>
    result.status === 'fulfilled' ? result.value : {
      ...spots[index],
      temp: spots[index].temp ?? TICKER_WEATHER_FALLBACK.temp,
      weather: spots[index].weather ?? TICKER_WEATHER_FALLBACK.weather,
    },
  );
}
