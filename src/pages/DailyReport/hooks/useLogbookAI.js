// src/pages/DailyReport/hooks/useLogbookAI.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Fix] 비관적 파싱 방어(Safe Path): JSON 제어 문자 평탄화 유지.
// 2. [New] 상태 유지(Persistence): sessionStorage를 사용하여 탭 이동 후에도 큐레이션 결과 유지.
// 3. [New] 중복 방지(Anti-Duplicate): sessionStorage에 추천 히스토리를 배열로 누적하여 프롬프트에 주입.
// 4. 🚨 [Fix/Subtraction] 데이터 3개 미만 시 무조건 하드코딩된 Fallback(아이투타키)을 반환하던 조건문 완전히 제거. 데이터 부족 시에도 AI가 정상적으로 큐레이션을 수행하도록 제한 해제.

import { useState } from 'react';
import { getLogbookPrompt, getCurationPrompt } from '../../Home/lib/prompts';
import { apiClient } from '../../Home/lib/apiClient';
import { convertToBase64 } from './useLogbookMedia';
import { getCoordinatesFromAddress } from '../../Home/lib/geocoding';

// --- 기존 글쓰기 AI 훅 ---
export const useLogbookAI = (title, setTitle, content, setContent, date, mapLocation) => {
  const [isAILoading, setIsAILoading] = useState(false);
  const [backupData, setBackupData] = useState(null);

  const handleAIPolish = async (mode, imageFiles) => {
    if (!content.trim() && imageFiles.length === 0) {
      alert("AI가 분석할 내용이나 사진이 없습니다. 짧은 메모나 사진을 먼저 추가해주세요.");
      return;
    }

    const originalTitle = title;
    const originalContent = content;

    setBackupData({ title: originalTitle, content: originalContent });
    setIsAILoading(true);

    try {
      // 🚨 보안 수정: 클라이언트에서 API 키를 넘기지 않습니다.
      let base64Images = [];
      if (imageFiles.length > 0) {
        base64Images = await Promise.all(imageFiles.map(file => convertToBase64(file)));
      }

      const prompt = getLogbookPrompt(mode, date, mapLocation, content, imageFiles.length);

      const resultText = await apiClient.fetchProxyGemini(
        null,
        [],
        "사용자의 메모와 사진을 분석하여 블로그 형식으로 변환하세요. 팩트를 왜곡하지 않는 세련된 에세이를 지향합니다.",
        prompt,
        base64Images,
        "gemini-2.5-pro" // 🚨 [Blog] 3.1 모델 호출 실패(404)를 방지하기 위해 가장 안정적인 2.5-pro 모델로 롤백. 텍스트 프롬프트 고도화로 품질은 보장됨.
      );

      setContent(resultText);
      if (!title) setTitle(`${mapLocation ? mapLocation : '어느 멋진 곳'}에서의 기록`);

    } catch (error) {
      console.error("AI 변환 실패:", error);
      alert("AI 변환 중 오류가 발생했습니다. 원본을 안전하게 복구합니다.");

      setTitle(originalTitle);
      setContent(originalContent);
      setBackupData(null);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleRestoreBackup = () => {
    if (!backupData) return;
    setTitle(backupData.title);
    setContent(backupData.content);
    setBackupData(null);
  };

  return { isAILoading, backupData, handleAIPolish, handleRestoreBackup };
};

// 🚨 큐레이션 전용 커스텀 훅 (세션 스토리지 기반 상태 유지)
export const useCurationAI = () => {
  const [status, setStatus] = useState(() => {
    try {
      const cached = sessionStorage.getItem('gateo_curation_data');
      return cached && JSON.parse(cached) ? 'result' : 'idle';
    } catch {
      return 'idle';
    }
  });

  const [curationData, setCurationData] = useState(() => {
    try {
      const cached = sessionStorage.getItem('gateo_curation_data');
      return cached ? JSON.parse(cached) : null;
    } catch {
      console.warn("🚨 [Safe Path] 세션 스토리지 데이터 손상. 초기화합니다.");
      sessionStorage.removeItem('gateo_curation_data');
      return null;
    }
  });

  const generateCuration = async (user, validReports, validSaved, fallbackData) => {
    setStatus('loading');

    try {
      if (!user) throw new Error("로그인이 필요합니다.");

      let curationHistory = JSON.parse(sessionStorage.getItem('gateo_curation_history') || '[]');

      // 🚨 [Subtraction] totalDataCount < 3 제한 로직 완전 삭제 (Fallback 무한 루프의 원인 제거)

      const systemPrompt = getCurationPrompt(validReports, validSaved, curationHistory);
      // 🚨 보안 수정: 클라이언트에서 API 키를 넘기지 않습니다.

      const resultText = await apiClient.fetchProxyGemini(null, [], systemPrompt, "");

      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON 파싱 실패: 형식을 찾을 수 없음");

      const safeJsonString = jsonMatch[0].replace(/[\n\r\t]+/g, ' ');
      const parsedData = JSON.parse(safeJsonString);

      if (parsedData.location && !curationHistory.includes(parsedData.location)) {
        curationHistory.push(parsedData.location);
        sessionStorage.setItem('gateo_curation_history', JSON.stringify(curationHistory));
      }

      const unsplashKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
      let finalImageUrl = fallbackData.imageUrl;

      if (unsplashKey && parsedData.searchKeyword) {
        let images = await apiClient.fetchUnsplashImages(unsplashKey, parsedData.searchKeyword);

        // 🚨 [Fallback] 첫 검색 실패 시 영문 지명과 풍경 키워드로 재검색하여 이미지 확보율 향상
        if ((!images || images.length === 0) && parsedData.locationEn) {
          const simpleLocation = parsedData.locationEn.split(',')[0].trim();
          images = await apiClient.fetchUnsplashImages(unsplashKey, simpleLocation + " nature landscape");
        }

        if (images && images.length > 0) finalImageUrl = images[0].urls.regular;
      }

      const finalData = { ...parsedData, imageUrl: finalImageUrl };

      // 🚨 [New] 큐레이션 데이터에 위도/경도(lat, lng) 좌표 강제 병합 (홈 지도 렌더링 목적)
      const coords = await getCoordinatesFromAddress(parsedData.locationEn || parsedData.location);
      if (coords) {
        finalData.lat = coords.lat;
        finalData.lng = coords.lng;
      } else {
        // Fallback: 좌표 획득 실패 시 기본값 부여 방지 (또는 임의의 초기값)
        finalData.lat = 0;
        finalData.lng = 0;
      }

      setCurationData(finalData);
      sessionStorage.setItem('gateo_curation_data', JSON.stringify(finalData));
      setStatus('result');

    } catch (error) {
      console.warn("🚨 큐레이션 에러:", error);
      setCurationData(fallbackData);
      sessionStorage.setItem('gateo_curation_data', JSON.stringify(fallbackData));
      setStatus('result');
    }
  };

  return { status, setStatus, curationData, generateCuration };
};
