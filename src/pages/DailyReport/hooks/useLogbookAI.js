import { useCallback, useEffect, useRef, useState } from 'react';
import { i18n } from '../../../i18n/config';
import { getLogbookPrompt, getCurationPrompt } from '../../Home/lib/prompts.js';
import { apiClient } from '../../Home/lib/apiClient.js';
import { convertToBase64 } from './useLogbookMedia';
import { getCoordinatesFromAddress } from '../../Home/lib/geocoding.js';
import { TRAVEL_SPOTS } from '../../Home/data/travelSpots.js';
import { resolveTravelSpotFromSearchQuery } from '../../../utils/travelSpotResolve.js';
import { hasValidCurationCoords } from '../../Home/lib/curationPlaceBridge.js';
import {
  destinationLabel,
  RECENT_SEARCH_KEY,
  safeLoadRecentList,
  safeLoadRecentVisited,
} from '../../Home/lib/exploreRecentHistory.js';
import { supabase } from '../../../shared/api/supabase';
import {
  curationEntryToPanelData,
  historyExcludeLocations,
  readCurationData,
  readCurationHistory,
  readCurationRejected,
  readCurationTasteSurvey,
  removeCurationHistoryEntry,
  resolveActiveCurationPanel,
  clearCurationData,
  upsertCurationHistoryEntry,
  upsertCurationRejectedEntry,
  writeCurationData,
  writeCurationHistory,
  writeCurationRejected,
} from '../lib/curationHistory.js';
import {
  buildCurationImageQueries,
  curationPlaceStatsCandidates,
  pickImageFromPlaceStatsRows,
} from '../lib/curationImageResolve.js';

export const useLogbookAI = (title, setTitle, content, setContent, date, mapLocation) => {
  const [isAILoading, setIsAILoading] = useState(false);
  const [backupData, setBackupData] = useState(null);

  const handleAIPolish = async (mode, imageFiles) => {
    if (!content.trim() && imageFiles.length === 0) {
      alert(i18n.t('logbook.ai.noInput'));
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
      if (!title) setTitle(i18n.t('logbook.write.defaultTitle', { place: mapLocation || i18n.t('logbook.write.defaultPlace') }));

    } catch (error) {
      console.error("AI 변환 실패:", error);
      alert(i18n.t('logbook.ai.fail'));

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

async function resolveCurationImageFromPlaceStats(parsedData, catalogSpot = null) {
  const candidates = curationPlaceStatsCandidates(parsedData, catalogSpot);
  if (!candidates.length) return { imageUrl: null, imageSource: null };

  try {
    const { data, error } = await supabase
      .from('place_stats')
      .select('place_id, image_url, gallery_urls')
      .in('place_id', candidates.slice(0, 12));

    if (error || !Array.isArray(data) || data.length === 0) {
      return { imageUrl: null, imageSource: null };
    }
    return pickImageFromPlaceStatsRows(data, candidates);
  } catch {
    return { imageUrl: null, imageSource: null };
  }
}

async function resolveCurationImageUrl(parsedData, catalogSpot = null) {
  const unsplashKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  const pexelsKey = import.meta.env.VITE_PEXELS_API_KEY;
  const queries = buildCurationImageQueries(parsedData);

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

  return resolveCurationImageFromPlaceStats(parsedData, catalogSpot);
}

export const useCurationAI = () => {
  const [boot] = useState(() => resolveActiveCurationPanel());
  const [status, setStatus] = useState(() => (boot.panel ? 'result' : 'idle'));
  const [curationData, setCurationData] = useState(() => boot.panel);
  const [history, setHistory] = useState(() => boot.history);
  const imageHealKeyRef = useRef('');

  const persistResult = useCallback((finalData) => {
    const panel = writeCurationData(finalData) || curationEntryToPanelData(finalData);
    const nextHistory = writeCurationHistory(
      upsertCurationHistoryEntry(readCurationHistory(), { ...panel, savedAt: Date.now() }),
    );
    setCurationData(panel);
    setHistory(nextHistory);
    setStatus('result');
    return panel;
  }, []);

  const healMissingImage = useCallback(async (panel) => {
    if (!panel?.location || panel.imageUrl) return panel;
    const catalogSpot = matchSpotForCuration(panel);
    const resolved = await resolveCurationImageFromPlaceStats(panel, catalogSpot);
    if (!resolved?.imageUrl) return panel;
    return persistResult({
      ...panel,
      imageUrl: resolved.imageUrl,
      imageSource: resolved.imageSource || 'place_stats',
      slug: panel.slug || catalogSpot?.slug,
    });
  }, [persistResult]);

  const selectFromHistory = useCallback((entry) => {
    const panel = curationEntryToPanelData(entry);
    if (!panel) return false;
    writeCurationData(panel);
    setCurationData(panel);
    setStatus('result');
    if (!panel.imageUrl) {
      void healMissingImage(panel);
    }
    return true;
  }, [healMissingImage]);

  const dismissFromHistory = useCallback((entry) => {
    const location = String(entry?.location || '').trim();
    if (!location) return false;

    const nextRejected = writeCurationRejected(
      upsertCurationRejectedEntry(readCurationRejected(), {
        location,
        locationEn: entry?.locationEn,
        rejectedAt: Date.now(),
      }),
    );
    const nextHistory = writeCurationHistory(
      removeCurationHistoryEntry(readCurationHistory(), location),
    );
    setHistory(nextHistory);

    const wasMain = curationData?.location === location;
    if (wasMain) {
      const nextPanel = curationEntryToPanelData(nextHistory[0]);
      if (nextPanel) {
        writeCurationData(nextPanel);
        setCurationData(nextPanel);
        setStatus('result');
        if (!nextPanel.imageUrl) void healMissingImage(nextPanel);
      } else {
        clearCurationData();
        setCurationData(null);
        setStatus('idle');
      }
    }

    return { rejected: nextRejected, history: nextHistory, wasMain };
  }, [curationData?.location, healMissingImage]);

  useEffect(() => {
    if (!curationData?.location || curationData.imageUrl) return;
    const key = `${curationData.location}|${curationData.slug || ''}`;
    if (imageHealKeyRef.current === key) return;
    imageHealKeyRef.current = key;
    void healMissingImage(curationData);
  }, [curationData, healMissingImage]);

  const generateCuration = async (validReports = [], validSaved = [], { tasteTags } = {}) => {
    setStatus('loading');

    try {
      const curationHistory = readCurationHistory();
      const excludeNames = historyExcludeLocations(curationHistory);
      const rejectedList = readCurationRejected();
      const survey = readCurationTasteSurvey();
      const tags = Array.isArray(tasteTags) && tasteTags.length
        ? tasteTags
        : survey?.tags || [];
      const recentSearches = safeLoadRecentList(RECENT_SEARCH_KEY).slice(0, 10);
      const recentVisited = safeLoadRecentVisited()
        .map((item) => destinationLabel(item))
        .filter(Boolean)
        .slice(0, 10);
      const systemPrompt = getCurationPrompt(validReports, validSaved, excludeNames, {
        rejectedList,
        tasteTags: tags,
        recentSearches,
        recentVisited,
        locale: i18n.language,
      });

      const resultText = await apiClient.fetchProxyGemini(null, [], systemPrompt, "");

      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON 파싱 실패: 형식을 찾을 수 없음");

      const safeJsonString = jsonMatch[0].replace(/[\n\r\t]+/g, ' ');
      const parsedData = JSON.parse(safeJsonString);
      if (!parsedData?.location) throw new Error("큐레이션 지명 누락");

      const catalogSpot = matchSpotForCuration(parsedData);
      const { imageUrl, imageSource } = await resolveCurationImageUrl(parsedData, catalogSpot);

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

      persistResult(finalData);

    } catch (error) {
      console.warn("큐레이션 에러:", error);
      alert(i18n.t('logbook.curationHub.fail'));
      const { panel } = resolveActiveCurationPanel();
      if (panel?.location) {
        setCurationData(panel);
        setHistory(readCurationHistory());
        setStatus('result');
        return;
      }
      setStatus('idle');
    }
  };

  return {
    status,
    setStatus,
    curationData,
    history,
    generateCuration,
    selectFromHistory,
    dismissFromHistory,
  };
};
