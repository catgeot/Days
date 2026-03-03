// src/pages/DailyReport/hooks/useLogbookAI.js
// 🚨 [New] 관심사 분리: AI 통신, 롤백 로직, 백업 데이터 관리를 전담하는 커스텀 훅
// 🚨 [Fix] 지역 변수 캐싱을 활용한 100% 안전한 데이터 롤백(Safe Path) 구현

import { useState } from 'react';
import { getLogbookPrompt } from '../../Home/lib/prompts';
import { apiClient } from '../../Home/lib/apiClient';
import { convertToBase64 } from './useLogbookMedia';

export const useLogbookAI = (title, setTitle, content, setContent, date, mapLocation) => {
  const [isAILoading, setIsAILoading] = useState(false);
  const [backupData, setBackupData] = useState(null);

  const handleAIPolish = async (mode, imageFiles) => {
    if (!content.trim() && imageFiles.length === 0) {
      alert("AI가 분석할 내용이나 사진이 없습니다. 짧은 메모나 사진을 먼저 추가해주세요.");
      return;
    }

    // 🚨 [Fix] 비관적 설계: 통신 전 현재 상태를 지역 변수에 즉시 박제 (Safe Path)
    const originalTitle = title;
    const originalContent = content;

    setBackupData({ title: originalTitle, content: originalContent });
    setIsAILoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API_KEY_MISSING");

      // 1. 이미지 Base64 인코딩
      let base64Images = [];
      if (imageFiles.length > 0) {
        base64Images = await Promise.all(imageFiles.map(file => convertToBase64(file)));
      }

      // 2. 프롬프트 생성 (2.0-flash 최적화)
      const prompt = getLogbookPrompt(mode, date, mapLocation, content, imageFiles.length);
      
      // 3. API 호출
      const resultText = await apiClient.fetchGeminiResponse(
        apiKey,
        [], 
        "사용자의 메모와 사진을 분석하여 블로그 형식으로 변환하세요.", 
        prompt,
        base64Images 
      );

      // 4. 결과 적용
      setContent(resultText); 
      if (!title) setTitle(`${mapLocation ? mapLocation : '어느 멋진 곳'}에서의 기록`);
      
    } catch (error) {
      console.error("AI 변환 실패:", error);
      alert("AI 변환 중 오류가 발생했습니다. 원본을 안전하게 복구합니다.");
      
      // 🚨 [Safe Path] 지역 변수를 활용한 즉각적인 롤백
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

  return {
    isAILoading,
    backupData,
    handleAIPolish,
    handleRestoreBackup
  };
};