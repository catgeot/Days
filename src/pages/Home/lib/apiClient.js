// 🚨 [New] API 통신을 전담하는 파일입니다. UI나 상태(State)를 포함하지 않습니다.

export const apiClient = {
  // --- 1. Gemini AI 통신 ---
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

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 답변을 생성하지 못했습니다.";

    } catch (error) {
      console.error("Gemini Fetch Error:", error);
      throw error; // 에러를 호출한 쪽(Hook)으로 던짐
    }
  },

  // --- 2. Unsplash 이미지 통신 ---
  fetchUnsplashImages: async (accessKey, query) => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?page=1&query=${query} travel&per_page=30&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      );

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Unsplash Fetch Error:", error);
      return []; // 에러 발생 시 빈 배열 반환하여 UI 깨짐 방지
    }
  }
};