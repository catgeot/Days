// src/pages/DailyReport/hooks/useLogbookAI.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fix] 비관적 파싱 방어(Safe Path): JSON 제어 문자 평탄화 유지.
// 2. [New] 상태 유지(Persistence): sessionStorage를 사용하여 탭 이동 후에도 큐레이션 결과 유지.
// 3. [New] 중복 방지(Anti-Duplicate): sessionStorage에 추천 히스토리를 배열로 누적하여 프롬프트에 주입.

import { useState } from 'react';
import { getLogbookPrompt, getCurationPrompt } from '../../Home/lib/prompts'; 
import { apiClient } from '../../Home/lib/apiClient';
import { convertToBase64 } from './useLogbookMedia';

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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API_KEY_MISSING");

      let base64Images = [];
      if (imageFiles.length > 0) {
        base64Images = await Promise.all(imageFiles.map(file => convertToBase64(file)));
      }

      const prompt = getLogbookPrompt(mode, date, mapLocation, content, imageFiles.length);
      
      const resultText = await apiClient.fetchGeminiResponse(
        apiKey,
        [], 
        "사용자의 메모와 사진을 분석하여 블로그 형식으로 변환하세요.", 
        prompt,
        base64Images 
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
  // 🚨 [New] 초기 마운트 시 sessionStorage 검사하여 상태 복원
  const [status, setStatus] = useState(() => {
    return sessionStorage.getItem('gateo_curation_data') ? 'result' : 'idle';
  });
  
  const [curationData, setCurationData] = useState(() => {
    const cached = sessionStorage.getItem('gateo_curation_data');
    return cached ? JSON.parse(cached) : null;
  });

  const generateCuration = async (user, validReports, validSaved, fallbackData) => {
    setStatus('loading');
    
    try {
      if (!user) throw new Error("로그인이 필요합니다.");

      // 🚨 [New] 세션 스토리지에서 이전 추천 기록(히스토리) 불러오기
      let curationHistory = JSON.parse(sessionStorage.getItem('gateo_curation_history') || '[]');

      const totalDataCount = validReports.length + validSaved.length;
      if (totalDataCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCurationData(fallbackData);
        sessionStorage.setItem('gateo_curation_data', JSON.stringify(fallbackData)); // Fallback도 저장
        setStatus('result');
        return;
      }

      // 🚨 [Fix] 제외 목록(curationHistory)을 프롬프트에 전달
      const systemPrompt = getCurationPrompt(validReports, validSaved, curationHistory);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      const resultText = await apiClient.fetchGeminiResponse(apiKey, [], systemPrompt, ""); 
      
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON 파싱 실패: 형식을 찾을 수 없음");
      
      const safeJsonString = jsonMatch[0].replace(/[\n\r\t]+/g, ' ');
      const parsedData = JSON.parse(safeJsonString);
      
      // 🚨 [New] 성공적으로 추천받은 장소는 히스토리에 누적 저장
      if (parsedData.location && !curationHistory.includes(parsedData.location)) {
        curationHistory.push(parsedData.location);
        sessionStorage.setItem('gateo_curation_history', JSON.stringify(curationHistory));
      }

      const unsplashKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
      let finalImageUrl = fallbackData.imageUrl; 

      if (unsplashKey && parsedData.searchKeyword) {
        const images = await apiClient.fetchUnsplashImages(unsplashKey, parsedData.searchKeyword);
        if (images && images.length > 0) finalImageUrl = images[0].urls.regular;
      }

      const finalData = { ...parsedData, imageUrl: finalImageUrl };
      
      setCurationData(finalData);
      // 🚨 [New] 결과물 세션 스토리지에 캐싱 (탭 이동 시 유지)
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