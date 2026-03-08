// 🚨 [Fix/New] Subtraction: axios 의존성 제거 및 브라우저 내장 fetch API로 전환
// 🚨 [Fix] API 할당량(Quota) 초과 등 HTTP 에러 발생 시 방어 로직 강화 (Pessimistic First)

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const youtubeClient = {
  /**
   * 장소명 기반 유튜브 영상 검색
   * @param {string} query 검색어
   * @returns {Promise<Array>} 정규화된 영상 데이터 리스트
   */
  searchVideos: async (query) => {
    if (!YOUTUBE_API_KEY) {
      console.error('[YouTube API] API Key가 설정되지 않았습니다.');
      return [];
    }

    try {
      // 🚨 [New] URLSearchParams를 활용한 안전한 쿼리 스트링 구성
      const params = new URLSearchParams({
        part: 'snippet',
        q: `${query} 여행 브이로그 travel vlog`,
        maxResults: '5',
        type: 'video',
        videoCaption: 'closedCaption', // 고품질 데이터 타겟팅
        relevanceLanguage: 'ko',
        regionCode: 'KR', // 🚨 [Fix/New] Localization: 한국 지역 검색 결과 강제를 위해 파라미터 추가
        key: YOUTUBE_API_KEY,
      });

      const response = await fetch(`${BASE_URL}/search?${params.toString()}`);

      // 🚨 [Pessimistic First] HTTP 상태 코드가 200~299가 아닐 경우 명시적 에러 발생
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`YouTube API Error: ${response.status} - ${errorData.error?.message || 'Unknown Error'}`);
      }

      const data = await response.json();

      // API 응답 데이터를 프로젝트 표준 규격(TRAVEL_VIDEOS)으로 변환
      // 🚨 [Fix] duration 필드 제거 (요청 사항 반영 유지)
      return data.items.map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        location_keyword: query,
        ai_context: {
          summary: item.snippet.description || '영상 설명이 없습니다.',
          tags: [`#${query}`, '#여행', '#vlog'],
          best_moment: { time: '00:00', desc: '자동 생성된 영상' },
          timeline: []
        },
      }));
    } catch (error) {
      console.error('[YouTube API] Fetch Error:', error.message);
      throw error; // 상위 hook에서 fallback 처리를 위해 에러 전파
    }
  },
};