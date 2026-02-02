// src/lib/apiClient.js
// 🚨 [Fix] Orientation 필터 제거 -> 웹 검색 결과와 동일한 풀(Pool) 확보

export const apiClient = {
  // Gemini 부분 유지...
  fetchGeminiResponse: async (apiKey, history, systemInstruction, userText) => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: `${systemInstruction}\n\n[이전 대화 내역]\n${JSON.stringify(history)}\n\n사용자 질문: ${userText}` }]
            }]
          })
        }
      );
      if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다.";
    } catch (error) {
      console.error("Gemini Fetch Error:", error);
      throw error;
    }
  },

  // --- 2. Unsplash 이미지 통신 ---
  fetchUnsplashImages: async (accessKey, query) => {
    try {
      if (!query) return [];
      
      const encodedQuery = encodeURIComponent(query);
      
      // 🚨 [Change] 'orientation=landscape' 제거 & 'order_by=relevant' 명시
      // 이제 세로 사진도 포함되며, Unsplash 웹의 기본 정렬(관련순)을 따릅니다.
      const response = await fetch(
        `https://api.unsplash.com/search/photos?page=1&query=${encodedQuery}&per_page=30&order_by=relevant`,
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
  }
};