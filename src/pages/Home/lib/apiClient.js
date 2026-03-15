// src/pages/Home/lib/apiClient.js
// 🚨 [Fix] Orientation 필터 제거 -> 웹 검색 결과와 동일한 풀(Pool) 확보
// 🚨 [New] 멀티모달(Vision) 지원을 위해 images 매개변수 추가 및 parts 배열 동적 생성
// 🚨 [Fix] 404 에러 해결 및 모델 티어 라우팅을 위해 엔드포인트를 gemini-2.5-flash로 전면 교체 (안정성 확보)

export const apiClient = {
  fetchGeminiResponse: async (apiKey, history, systemInstruction, userText, images = [], modelId = "gemini-2.5-flash") => {
    try {
      // 🚨 [Pessimistic First] 이미지가 없어도 안전하게 텍스트만 전송되도록 기본 배열 셋팅 (Safe Path)
      const parts = [{ text: `${systemInstruction}\n\n[이전 대화 내역]\n${JSON.stringify(history)}\n\n사용자 질문: ${userText}` }];

      // 🚨 [New] Base64 이미지 데이터가 존재할 경우 Vision AI 처리를 위해 parts에 추가
      if (images && images.length > 0) {
        images.forEach((imgBase64) => {
          // data URI 스킴(data:image/jpeg;base64,...)에서 mimeType과 순수 base64 데이터를 분리
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

      // 🚨 [Fix] 동적 모델 티어 라우팅 (기본값: gemini-2.5-flash, Fallback 등 초경량 작업은 gemini-2.5-flash-lite 등 사용)
      let response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: parts
            }]
          })
        }
      );

      // 🚨 [Fix] 503 에러 또는 모델 접근 실패 시, 가장 안정적인 2.5-flash로 자동 롤백 및 재시도
      if (!response.ok && (response.status === 503 || response.status === 404) && modelId !== "gemini-2.5-flash") {
        console.warn(`[API Fallback] ${modelId} failed with ${response.status}. Retrying with gemini-2.5-flash...`);
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: parts
              }]
            })
          }
        );
      }

      if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다.";
    } catch (error) {
      console.error("Gemini Fetch Error:", error);
      throw error;
    }
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
