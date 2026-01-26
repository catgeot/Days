import { useState, useCallback } from 'react';

export const useSearchEngine = () => {
  const [relatedTags, setRelatedTags] = useState([]);
  const [isTagLoading, setIsTagLoading] = useState(false);

  const processSearchKeywords = useCallback(async (query) => {
    if (!query) return;
    setIsTagLoading(true);
    try {
      // Mock 로직 (나중에 실제 AI API 연동)
      let tags = ["로컬 맛집", "인생샷 스팟", "추천 숙소", "야경 명소"];
      const cleanQuery = query.replace("📍", "").trim();
      if (cleanQuery.includes("베트남")) tags = ["다낭", "하롱베이", "나트랑", "푸꾸옥"];
      if (cleanQuery.includes("다낭")) tags = ["나트랑", "하롱베이", "호이안", "미케비치"];
      setRelatedTags(tags);
    } finally {
      setIsTagLoading(false);
    }
  }, []);

  return { relatedTags, isTagLoading, processSearchKeywords };
};