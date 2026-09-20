// src/pages/Home/lib/apiClient.js
// 🚨 [Fix] Orientation 필터 제거 -> 웹 검색 결과와 동일한 풀(Pool) 확보
// 🚨 [New] 멀티모달(Vision) 지원을 위해 images 매개변수 추가 및 parts 배열 동적 생성
// 모델 ID는 geminiModels.js SSOT · Edge gemini-proxy 경유

import { supabase } from '../../../shared/api/supabase';
import { filterOutSinglePersonPortraits } from '../../../utils/galleryPortraitFilter';
import { GEMINI_MODELS, resolveGeminiModelId } from '../../../utils/geminiModels';
import {
  classifyGeminiProxyFailure,
  GeminiProxyError,
} from './geminiProxyError';

export const apiClient = {
  // --- 1. 프록시 기반 Gemini 통신 (New) ---
  fetchProxyGemini: async (apiKey, history, systemInstruction, userText, images = [], modelId = GEMINI_MODELS.QUALITY) => {
    try {
      // 1. parts 배열 생성 (기존과 동일)
      const parts = [{ text: `${systemInstruction}\n\n[이전 대화 내역]\n${JSON.stringify(history)}\n\n사용자 질문: ${userText}` }];

      if (images && images.length > 0) {
        images.forEach((imgBase64) => {
          const mimeTypeMatch = imgBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/);
          const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
          const base64Data = imgBase64.replace(/^data:image\/\w+;base64,/, "");

          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        });
      }

      const finalModelId = resolveGeminiModelId(modelId);

      // 2. Edge Function 프록시 호출
      console.log(`[API Proxy] Calling gemini-proxy with model: ${finalModelId}`);
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { modelId: finalModelId, parts }
      });

      if (error || !data?.success) {
        const classified = classifyGeminiProxyFailure({ error, data });
        throw new GeminiProxyError(classified);
      }

      // 3. 결과 파싱
      return data.data?.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다.";

    } catch (error) {
      console.error("[API Proxy] Fetch Error:", error);
      if (error instanceof GeminiProxyError) throw error;
      throw new GeminiProxyError(classifyGeminiProxyFailure({ error }));
    }
  },

  // --- 기존 클라이언트 직접 호출 (Fallback 용도로 유지) ---
  fetchGeminiResponse: async (apiKey, history, systemInstruction, userText, images = [], modelId = GEMINI_MODELS.QUALITY) => {
    // 🚨 보안 수정: 더 이상 클라이언트에서 직접 구글 API를 호출하지 않습니다.
    // 기존에 fetchGeminiResponse를 사용하던 모든 호출은 프록시를 통하도록 리다이렉트합니다.
    console.warn("[API Deprecated] fetchGeminiResponse is deprecated. Redirecting to fetchProxyGemini.");
    return await apiClient.fetchProxyGemini(null, history, systemInstruction, userText, images, modelId);
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
