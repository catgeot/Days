import { useState } from 'react';
import { getLogbookPrompt, getCurationPrompt } from '../../Home/lib/prompts.js';
import { apiClient } from '../../Home/lib/apiClient.js';
import { convertToBase64 } from './useLogbookMedia';
import { getCoordinatesFromAddress } from '../../Home/lib/geocoding.js';
import { TRAVEL_SPOTS } from '../../Home/data/travelSpots.js';
import { resolveTravelSpotFromSearchQuery } from '../../../utils/travelSpotResolve.js';
import { hasValidCurationCoords } from '../../Home/lib/curationPlaceBridge.js';

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
        "gemini-2.5-pro"
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

function matchSpotForCuration(parsedData) {
  const dest = String(parsedData?.location || '').trim();
  const locationEn = String(parsedData?.locationEn || '').trim();
  const enCity = locationEn.split(',')[0].trim();
  if (!dest && !enCity) return null;

  const exact =
    TRAVEL_SPOTS.find(
      (s) =>
        s.name === dest ||
        s.name_en === dest ||
        (enCity && s.name_en && s.name_en.toLowerCase() === enCity.toLowerCase()),
    ) || null;
  if (exact) return exact;

  return (
    resolveTravelSpotFromSearchQuery(dest) ||
    (enCity ? resolveTravelSpotFromSearchQuery(enCity) : null) ||
    null
  );
}

async function resolveCurationImageUrl(parsedData) {
  const unsplashKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  const pexelsKey = import.meta.env.VITE_PEXELS_API_KEY;
  const queries = [];
  if (parsedData.searchKeyword) queries.push(String(parsedData.searchKeyword).trim());
  if (parsedData.locationEn) {
    const simpleLocation = String(parsedData.locationEn).split(',')[0].trim();
    if (simpleLocation) queries.push(`${simpleLocation} nature landscape`);
  }
  if (parsedData.location) queries.push(String(parsedData.location).trim());

  for (const query of queries) {
    if (!query) continue;
    if (unsplashKey) {
      const images = await apiClient.fetchUnsplashImages(unsplashKey, query);
      if (images?.length > 0 && images[0]?.urls?.regular) {
        return {
          imageUrl: images[0].urls.regular,
          imageSource: 'unsplash',
        };
      }
    }
    if (pexelsKey) {
      const images = await apiClient.fetchPexelsImages(pexelsKey, query);
      if (images?.length > 0 && images[0]?.urls?.regular) {
        return {
          imageUrl: images[0].urls.regular,
          imageSource: 'pexels',
        };
      }
    }
  }

  return { imageUrl: null, imageSource: null };
}

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
      console.warn("세션 스토리지 큐레이션 데이터 손상. 초기화합니다.");
      sessionStorage.removeItem('gateo_curation_data');
      return null;
    }
  });

  const generateCuration = async (user, validReports, validSaved) => {
    setStatus('loading');

    try {
      if (!user) throw new Error("로그인이 필요합니다.");

      let curationHistory = JSON.parse(sessionStorage.getItem('gateo_curation_history') || '[]');

      const systemPrompt = getCurationPrompt(validReports, validSaved, curationHistory);

      const resultText = await apiClient.fetchProxyGemini(null, [], systemPrompt, "");

      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON 파싱 실패: 형식을 찾을 수 없음");

      const safeJsonString = jsonMatch[0].replace(/[\n\r\t]+/g, ' ');
      const parsedData = JSON.parse(safeJsonString);
      if (!parsedData?.location) throw new Error("큐레이션 지명 누락");

      if (parsedData.location && !curationHistory.includes(parsedData.location)) {
        curationHistory.push(parsedData.location);
        sessionStorage.setItem('gateo_curation_history', JSON.stringify(curationHistory));
      }

      const catalogSpot = matchSpotForCuration(parsedData);
      const { imageUrl, imageSource } = await resolveCurationImageUrl(parsedData);

      const finalData = {
        ...parsedData,
        imageUrl: imageUrl || null,
        imageSource: imageSource || null,
      };

      if (catalogSpot) {
        finalData.slug = catalogSpot.slug || finalData.slug;
        finalData.country = catalogSpot.country || finalData.country;
        finalData.country_en = catalogSpot.country_en || finalData.country_en;
        if (hasValidCurationCoords(catalogSpot)) {
          finalData.lat = Number(catalogSpot.lat);
          finalData.lng = Number(catalogSpot.lng);
        }
      }

      if (!hasValidCurationCoords(finalData)) {
        const coords = await getCoordinatesFromAddress(parsedData.locationEn || parsedData.location);
        if (coords && hasValidCurationCoords(coords)) {
          finalData.lat = coords.lat;
          finalData.lng = coords.lng;
          if (coords.country) finalData.country = finalData.country || coords.country;
          if (coords.country_en) finalData.country_en = finalData.country_en || coords.country_en;
          if (coords.name_en && !finalData.locationEn) finalData.locationEn = coords.name_en;
        }
      }

      if (!hasValidCurationCoords(finalData)) {
        delete finalData.lat;
        delete finalData.lng;
      }

      setCurationData(finalData);
      sessionStorage.setItem('gateo_curation_data', JSON.stringify(finalData));
      setStatus('result');

    } catch (error) {
      console.warn("큐레이션 에러:", error);
      alert("큐레이션에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      try {
        const cached = sessionStorage.getItem('gateo_curation_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.location) {
            setCurationData(parsed);
            setStatus('result');
            return;
          }
        }
      } catch {
        /* ignore */
      }
      setStatus('idle');
    }
  };

  return { status, setStatus, curationData, generateCuration };
};
