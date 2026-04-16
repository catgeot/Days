// src/pages/Home/lib/apiClient.js
// 🚨 [Fix] Orientation 필터 제거 -> 웹 검색 결과와 동일한 풀(Pool) 확보
// 🚨 [New] 멀티모달(Vision) 지원을 위해 images 매개변수 추가 및 parts 배열 동적 생성
// 🚨 [Fix] 404 에러 해결 및 모델 티어 라우팅을 위해 엔드포인트를 gemini-2.5-flash로 전면 교체 (안정성 확보)

import { supabase } from '../../../shared/api/supabase';

export const apiClient = {
  // --- 1. 프록시 기반 Gemini 통신 (New) ---
  fetchProxyGemini: async (apiKey, history, systemInstruction, userText, images = [], modelId = "gemini-2.5-flash") => {
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

      // 제미나이 3.1 라우팅 지원 (modelId가 gemini-3.1-pro로 올 경우 gemini-3.1-pro-preview로 매핑)
      let finalModelId = modelId;
      if (modelId === "gemini-3.1-pro") {
        finalModelId = "gemini-3.1-pro-preview";
      }

      // 2. Edge Function 프록시 호출
      console.log(`[API Proxy] Calling gemini-proxy with model: ${finalModelId}`);
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { modelId: finalModelId, parts }
      });

      if (error) throw error;
      if (!data || !data.success) throw new Error(data?.error || "Proxy returned unsuccessful response");

      // 3. 결과 파싱
      return data.data?.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다.";

    } catch (error) {
      console.error("[API Proxy] Fetch Error:", error);
      // 클라이언트 측 직접 API 호출(Fallback)을 보안상 전면 제거합니다.
      // 프록시 실패 시 에러를 반환하여 상위에서 처리하도록 합니다.
      throw new Error("AI 서버와의 통신에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  },

  // --- 기존 클라이언트 직접 호출 (Fallback 용도로 유지) ---
  fetchGeminiResponse: async (apiKey, history, systemInstruction, userText, images = [], modelId = "gemini-2.5-flash") => {
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

      // 'orientation=landscape' 제거 & 'order_by=relevant' 명시
      const response = await fetch(
        `https://api.unsplash.com/search/photos?page=${page}&query=${encodedQuery}&per_page=30&order_by=relevant`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      );

      if (!response.ok) {
        console.error(`Unsplash API Error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Unsplash Fetch Error:", error);
      return [];
    }
  },

  // --- 3. Pexels 이미지 통신 (Fallback) ---
  fetchPexelsImages: async (apiKey, query, page = 1) => {
    try {
      if (!query || !apiKey) return [];

      const encodedQuery = encodeURIComponent(query);

      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodedQuery}&per_page=30&page=${page}`,
        { headers: { Authorization: apiKey } }
      );

      if (!response.ok) {
        console.error(`Pexels API Error: ${response.status}`);
        return [];
      }

      const data = await response.json();

      // Unsplash 응답 객체 포맷과 호환되도록 매핑
      return (data.photos || []).map(photo => ({
        id: `pexels-${photo.id}`,
        urls: {
          regular: photo.src.large, // 일반 뷰용 (가로 최대 940px)
          small: photo.src.medium,  // 썸네일용 (높이 350px)
          full: photo.src.original  // 원본 다운로드/확대용
        },
        user: {
          name: photo.photographer || 'Pexels Contributor'
        },
        links: {
          html: photo.url
          // Pexels는 Unsplash와 같은 별도의 download_location 트래킹 API를 강제하지 않으므로 생략
        }
      }));
    } catch (error) {
      console.error("Pexels Fetch Error:", error);
      return [];
    }
  }
};
