// src/pages/Home/lib/apiClient.js
// 🚨 [Fix] Orientation 필터 제거 -> 웹 검색 결과와 동일한 풀(Pool) 확보
// 🚨 [New] 멀티모달(Vision) 지원을 위해 images 매개변수 추가 및 parts 배열 동적 생성
// 모델 ID는 geminiModels.js SSOT · Edge gemini-proxy 경유

import { supabase } from '../../../shared/api/supabase';
import { filterOutSinglePersonPortraits } from '../../../utils/galleryPortraitFilter';
import {
  classifyGeminiProxyFailure,
  GeminiProxyError,
} from './geminiProxyError';
import { parseGeminiProxySuccess } from './geminiProxyResult.js';

async function readInvokeFailure(error) {
  const ctx = error && typeof error === 'object' ? error.context : null;
  if (ctx instanceof Response) {
    let data = null;
    try {
      data = await ctx.clone().json();
    } catch {
      data = null;
    }
    return { httpStatus: ctx.status, data };
  }
  if (ctx && typeof ctx.status === 'number') {
    return { httpStatus: ctx.status, data: null };
  }
  return { httpStatus: null, data: null };
}

export const apiClient = {
  invokeGeminiTask: async (task, params) => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { task, params },
      });
      if (error || !data?.success) {
        const extra = error ? await readInvokeFailure(error) : { httpStatus: null, data: null };
        throw new GeminiProxyError(classifyGeminiProxyFailure({
          error,
          data: data ?? extra.data,
          httpStatus: extra.httpStatus,
        }));
      }
      return parseGeminiProxySuccess(data);
    } catch (error) {
      console.error('[API Proxy] Fetch Error:', error);
      if (error instanceof GeminiProxyError) throw error;
      const extra = await readInvokeFailure(error);
      throw new GeminiProxyError(classifyGeminiProxyFailure({
        error,
        data: extra.data,
        httpStatus: extra.httpStatus,
      }));
    }
  },

  // --- 2. Unsplash 이미지 통신 ---
  fetchUnsplashImages: async (accessKey, query, page = 1) => {
    try {
      if (!query) return [];

      const encodedQuery = encodeURIComponent(query);

      // orientation=landscape 금지 — 세로 전경까지 잘림. 인물은 응답 메타로만 제외.
      const response = await fetch(
        `https://api.unsplash.com/search/photos?page=${page}&query=${encodedQuery}&per_page=30&order_by=relevant`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      );

      if (!response.ok) {
        console.error(`Unsplash API Error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return filterOutSinglePersonPortraits(data.results || []);
    } catch (error) {
      console.error("Unsplash Fetch Error:", error);
      return [];
    }
  },

  mapPexelsPhotos: (photos) => (photos || []).map((photo) => ({
    id: `pexels-${photo.id}`,
    source: 'pexels',
    width: photo.width,
    height: photo.height,
    alt: photo.alt,
    alt_description: photo.alt,
    urls: {
      regular: photo.src?.large || photo.src?.large2x,
      small: photo.src?.medium,
      full: photo.src?.original,
    },
    user: {
      name: photo.photographer || 'Pexels Contributor',
    },
    links: {
      html: photo.url,
    },
  })),

  fetchPexelsImagesViaProxy: async (query, page = 1) => {
    try {
      if (!query) return [];
      const { data, error } = await supabase.functions.invoke('pexels-proxy', {
        body: { query, page },
      });
      if (error || !data?.success || !Array.isArray(data.images)) return [];
      return filterOutSinglePersonPortraits(data.images);
    } catch (error) {
      console.error('Pexels Proxy Fetch Error:', error);
      return [];
    }
  },

  // --- 3. Pexels 이미지 통신 (Fallback) — VITE 키 없으면 Edge pexels-proxy ---
  fetchPexelsImages: async (apiKey, query, page = 1) => {
    try {
      if (!query) return [];

      if (apiKey) {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodedQuery}&per_page=30&page=${page}`,
          { headers: { Authorization: apiKey } },
        );

        if (!response.ok) {
          console.error(`Pexels API Error: ${response.status}`);
          return apiClient.fetchPexelsImagesViaProxy(query, page);
        }

        const data = await response.json();
        return filterOutSinglePersonPortraits(apiClient.mapPexelsPhotos(data.photos || []));
      }

      return apiClient.fetchPexelsImagesViaProxy(query, page);
    } catch (error) {
      console.error('Pexels Fetch Error:', error);
      return [];
    }
  },
};
