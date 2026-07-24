import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Sparkles, Loader2, RefreshCw, Quote, Camera, ArrowUp, X, ChevronLeft as ChevronLeftIcon, ChevronRight, ChevronDown, Briefcase, ImageIcon, Download, PenLine } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { parseAiPracticalInfo } from '../../../utils/aiDataParser';
import {
  buildPlaceDbIdCandidates,
  getPlaceStableKey,
  isHubAttractionLocation,
  mergeCanonicalTravelSpot,
  resolveTravelSpotFromLocation,
} from '../../../utils/travelSpotResolve';
import CopyableText from '../common/CopyableText';
import PlaceWikiLocatorMap from '../common/PlaceWikiLocatorMap';
import { mobilePlaceHeaderSpacerClass, mobileLandscapeChromeHidden } from '../common/mobilePlaceHeaderInset';
import { placeScrollSurfaceClass } from '../common/placeScrollSurface';
import { usePlaceMediaScrollToTop } from '../common/usePlaceMediaScrollToTop';
import { getGalleryImageAttribution } from '../common/galleryImageAttribution';
import GalleryAttributionLink from '../common/GalleryAttributionLink';
import {
  clearGalleryAttributionReturnState,
  consumeGalleryAttributionReturnState,
  findImageForReturnState,
  readGalleryAttributionReturnState,
  resolveGalleryPlaceKey,
} from '../common/galleryAttributionNavigation';
import PlaceOverviewProse from '../common/PlaceOverviewProse';
import {
  ensurePlaceChatIntroForLocation,
  needsPlaceChatIntroHydration,
} from '../../../pages/Home/lib/placeChatIntro';
import { resolveHubAttractionParentSketch } from '../../../pages/Home/lib/placeWikiParentSketch';
import { fetchPlaceWikiBestRow } from '../hooks/useWikiData';

const LOADING_MESSAGES_NEW = [
    "여행 스케치 자료 분석 및 연동 중...",
    "핵심 랜드마크와 역사적 배경 스캔 중...",
    "여행자를 위한 실용적인 로컬 팁 추출 중...",
    "날씨, 문화, 예절 등 필수 지식 정리 중...",
    "명소 주변 숨겨진 핫플레이스 탐색 중...",
    "AI가 최종 로컬 왓슨 노트를 완성하는 중..."
];

const LOADING_MESSAGES_UPDATE = [
    "기존 로컬 왓슨 노트를 불러오는 중...",
    "최근 변경된 현지 이슈와 팁을 확인하는 중...",
    "새로운 여행 트렌드를 기반으로 데이터 비교 중...",
    "변경 사항을 반영하여 정보를 재조립하는 중...",
    "AI가 최종 로컬 왓슨 노트를 검수하는 중..."
];

const MAGAZINE_LOADING_MESSAGES = [
    "하이엔드 매거진 에디터가 서사를 구상하는 중...",
    "오감 자극 묘사와 로컬 루트를 엮는 중...",
    "프롤로그와 7개 피처 섹션을 집필하는 중...",
    "문장 리듬과 여백을 다듬는 중...",
    "GATEO 여행 스케치 매거진을 완성하는 중..."
];

/** summary + sections 가 모두 채워진 완성 매거진인지 */
function hasMagazineContent(wikiData) {
  if (!wikiData) return false;
  if (wikiData.summary === '[[LOADING]]') return false;
  const summaryOk = Boolean(wikiData.summary && String(wikiData.summary).trim());
  const sectionsOk = Array.isArray(wikiData.sections) && wikiData.sections.length > 0;
  return summaryOk && sectionsOk;
}

const PlaceWikiDetailsView = ({
  wikiData,
  isWikiLoading,
  placeName,
  countryName,
  location,
  galleryData,
  isActive,
  matchedPackage,
  onOpenPackage,
  onNavigateToPlace,
  mobileSecondaryNav = null
}) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMagazineGenerating, setIsMagazineGenerating] = useState(false);
  const [magazineError, setMagazineError] = useState(null);
  const [parentHasMagazine, setParentHasMagazine] = useState(false);
  const [magazineLoadingStep, setMagazineLoadingStep] = useState(0);

  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [localAiResponse, setLocalAiResponse] = useState(null);
  const [localUpdatedAt, setLocalUpdatedAt] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // 라이트박스 상태 (갤러리 이미지만)
  const [lightboxImg, setLightboxImg] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0); // galleryImages 내에서의 인덱스

  const lightboxAttribution = useMemo(
    () => (lightboxImg ? getGalleryImageAttribution(lightboxImg) : null),
    [lightboxImg],
  );

  const lightboxCaption = useMemo(() => {
    if (!lightboxImg) return '';
    const raw = (lightboxImg.alt_description || lightboxImg.description || '').trim();
    if (!raw) return '';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [lightboxImg]);

  const handleLightboxDownload = galleryData?.handleDownload;

  const isUpdatingExisting = !!wikiData?.ai_practical_info && wikiData.ai_practical_info !== '[[LOADING]]';
  const currentMessages = isUpdatingExisting ? LOADING_MESSAGES_UPDATE : LOADING_MESSAGES_NEW;

  const aiSectionRef = useRef(null);
  const containerRef = useRef(null);
  const scrollToTop = usePlaceMediaScrollToTop('WIKI', containerRef, isActive);
  const [scrollY, setScrollY] = useState(0);

  // 라이트박스 열렸을 때 스크롤 방지
  useEffect(() => {
      if (lightboxImg) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = '';
      }
      return () => {
          document.body.style.overflow = '';
      };
  }, [lightboxImg]);

  // 스크롤 이벤트 리스너 (맨 위로 가기 버튼용)
  useEffect(() => {
      const handleScroll = () => {
          if (containerRef.current) {
              setScrollY(containerRef.current.scrollTop);
          }
      };

      const container = containerRef.current;
      if (container) {
          container.addEventListener('scroll', handleScroll);
      }
      return () => {
          if (container) {
              container.removeEventListener('scroll', handleScroll);
          }
      };
  }, []);

  useEffect(() => {
      let interval;
      if (isAiLoading) {
          setLoadingStep(0);
          interval = setInterval(() => {
              setLoadingStep((prev) => (prev < currentMessages.length - 1 ? prev + 1 : prev));
          }, 4000);
      }
      return () => clearInterval(interval);
  }, [isAiLoading, currentMessages]);

  const isMagazineLoading =
    isMagazineGenerating || wikiData?.summary === '[[LOADING]]';

  useEffect(() => {
      let interval;
      if (isMagazineLoading) {
          setMagazineLoadingStep(0);
          interval = setInterval(() => {
              setMagazineLoadingStep((prev) =>
                  prev < MAGAZINE_LOADING_MESSAGES.length - 1 ? prev + 1 : prev
              );
          }, 5000);
      }
      return () => clearInterval(interval);
  }, [isMagazineLoading]);

  // DB 폴링으로 매거진이 채워지면 로컬 생성 상태 해제
  useEffect(() => {
      if (hasMagazineContent(wikiData)) {
          setIsMagazineGenerating(false);
          setMagazineError(null);
      } else if (wikiData?.summary === '[[LOADING]]') {
          setIsMagazineGenerating(true);
      }
  }, [wikiData?.summary, wikiData?.sections]);

  /** 매거진 없을 때 상단 — place_chat_intro (써머리와 동일 본문) */
  const [magazineIntro, setMagazineIntro] = useState(null);
  const [magazineIntroLoading, setMagazineIntroLoading] = useState(false);
  const magazineIntroPlaceKey = useMemo(
    () => getPlaceStableKey(location) || String(placeName || '').trim(),
    [location, placeName],
  );
  const locationDesc = String(location?.desc || '').trim();

  useEffect(() => {
    if (!isActive || isMagazineLoading || hasMagazineContent(wikiData)) {
      return undefined;
    }
    if (!magazineIntroPlaceKey) return undefined;

    const loc = location || { name: placeName, country: countryName };
    // 써머리 hydrate된 실문장 desc면 그대로 사용 (AI 재호출 없음)
    if (locationDesc && !needsPlaceChatIntroHydration(loc)) {
      setMagazineIntro(locationDesc);
      setMagazineIntroLoading(false);
      return undefined;
    }

    let cancelled = false;
    setMagazineIntroLoading(true);

    ensurePlaceChatIntroForLocation(loc, { generateIfMissing: true })
      .then((summary) => {
        if (!cancelled) setMagazineIntro(summary || null);
      })
      .catch(() => {
        if (!cancelled) setMagazineIntro(null);
      })
      .finally(() => {
        if (!cancelled) setMagazineIntroLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    isActive,
    isMagazineLoading,
    wikiData?.summary,
    wikiData?.sections,
    magazineIntroPlaceKey,
    locationDesc,
    location,
    placeName,
    countryName,
  ]);

  const requestInfoRef = useRef({ placeName, wikiTitle: wikiData?.title, placeId: wikiData?.place_id || placeName });
  useEffect(() => {
      requestInfoRef.current = { placeName, wikiTitle: wikiData?.title, placeId: wikiData?.place_id || placeName };
  }, [placeName, wikiData]);

  const parentSketch = useMemo(
    () => resolveHubAttractionParentSketch(location),
    [location],
  );

  useEffect(() => {
    if (!isActive || !parentSketch || hasMagazineContent(wikiData) || isMagazineLoading) {
      setParentHasMagazine(false);
      return undefined;
    }

    let cancelled = false;
    const candidates = buildPlaceDbIdCandidates(parentSketch.place);
    fetchPlaceWikiBestRow(candidates)
      .then((row) => {
        if (!cancelled) setParentHasMagazine(hasMagazineContent(row));
      })
      .catch(() => {
        if (!cancelled) setParentHasMagazine(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    isActive,
    parentSketch,
    wikiData?.summary,
    wikiData?.sections,
    isMagazineLoading,
  ]);

  const handleGenerateMagazine = useCallback(async () => {
      if (isMagazineLoading) return;

      const canonicalLoc = mergeCanonicalTravelSpot(location);
      const resolved = resolveTravelSpotFromLocation(location);
      const isHubAttr = isHubAttractionLocation(location);
      // hub 명소: 상위 도시 slug로 생성·저장하지 않음 (명소 자체 place_id)
      // 그 외 uiPlace soft-merge: SSOT slug 우선
      const slug = isHubAttr
          ? (
              location?.slug ||
              canonicalLoc?.slug ||
              (getPlaceStableKey(location) || '').toLowerCase() ||
              null
            )
          : (
              resolved?.spot?.slug ||
              canonicalLoc?.canonical_slug ||
              canonicalLoc?.slug ||
              location?.slug ||
              (getPlaceStableKey(canonicalLoc) || '').toLowerCase()
            );
      const placeId =
          slug ||
          wikiData?.place_id ||
          requestInfoRef.current.placeId ||
          placeName;
      const locationName = isHubAttr
          ? (
              placeName ||
              location?.name ||
              wikiData?.title ||
              requestInfoRef.current.placeName
            )
          : (
              placeName ||
              resolved?.spot?.name ||
              canonicalLoc?.name ||
              location?.name ||
              wikiData?.title ||
              requestInfoRef.current.placeName
            );

      if (!placeId || !locationName) {
          setMagazineError('장소 정보를 확인할 수 없습니다.');
          return;
      }

      setIsMagazineGenerating(true);
      setMagazineError(null);

      try {
          if (import.meta.env.DEV) {
              console.log('[PlaceWikiDetailsView] generate-place-magazine 호출', { placeId, locationName, slug });
          }

          const { data, error: functionError } = await supabase.functions.invoke('generate-place-magazine', {
              body: {
                  placeId,
                  canonicalPlaceId: placeId,
                  locationName,
                  slug,
                  forceUpdate: false,
              },
          });

          if (functionError) {
              console.error('[PlaceWikiDetailsView] Magazine Edge Error:', functionError);
              throw new Error('매거진 생성에 실패했습니다.');
          }

          if (!data?.success) {
              throw new Error(data?.error || '매거진을 생성하지 못했습니다.');
          }

          // 폴링이 wikiData를 갱신할 때까지 로딩 유지 (이미 완성본이면 useEffect가 해제)
          if (data.summary && Array.isArray(data.sections) && data.sections.length > 0) {
              setIsMagazineGenerating(false);
              window.dispatchEvent(new CustomEvent('magazine-updated', {
                  detail: { placeId, summary: data.summary, sections: data.sections },
              }));
          }
      } catch (err) {
          console.error('[PlaceWikiDetailsView] Magazine Request Error:', err);
          setMagazineError(err.message || '매거진 생성 중 오류가 발생했습니다.');
          setIsMagazineGenerating(false);
      }
  }, [isMagazineLoading, location, placeName, wikiData?.place_id, wikiData?.title]);

  useEffect(() => {
      const hasCachedInfo = wikiData?.ai_practical_info && wikiData.ai_practical_info !== '[[LOADING]]';

      if (hasCachedInfo) {
          setIsAiExpanded(true);
          setLocalAiResponse(wikiData.ai_practical_info);
          if (wikiData.ai_info_updated_at) {
              setLocalUpdatedAt(wikiData.ai_info_updated_at);
          }
      } else {
          setIsAiExpanded(false);
          setLocalAiResponse(null);
          setLocalUpdatedAt(null);
          setError(null);
      }
  }, [placeName, wikiData]);

  const prevAiInfoRef = useRef(wikiData?.ai_practical_info);

  const handleRequestAiInfo = useCallback(async (eventOrRemoteName, forceUpdate = false) => {
    setIsAiExpanded(true);
    // 스크롤은 isAiExpanded 변경 시 useEffect에서 처리됨

    const hasCachedInfo = wikiData?.ai_practical_info && wikiData.ai_practical_info !== '[[LOADING]]';

    if (!forceUpdate && hasCachedInfo) {
        if (import.meta.env.DEV) {
            console.log("[PlaceWikiDetailsView] 기존 캐시된 응답 있음 - 네트워크 호출 생략");
        }
        setIsAiLoading(true);
        setTimeout(() => {
            setLocalAiResponse(wikiData.ai_practical_info);
            setIsAiLoading(false);
        }, 3000);
        return;
    }

    if (!isAiLoading || forceUpdate) {
      if (import.meta.env.DEV) {
          console.log(`[PlaceWikiDetailsView] API 요청 시작 (location: ${eventOrRemoteName}, forceUpdate: ${forceUpdate})`);
      }
      const isClickEvent = eventOrRemoteName && typeof eventOrRemoteName === 'object' && 'type' in eventOrRemoteName;
      const remoteName = isClickEvent ? null : eventOrRemoteName;
      let location = remoteName || requestInfoRef.current.placeName || requestInfoRef.current.wikiTitle || "이 장소";

      if (countryName && countryName !== "Explore" && countryName !== "Ocean" && countryName !== "바다" && countryName !== "해양" && !location.includes(countryName)) {
          location = `${location} ${countryName}`;
      }

      const placeId = requestInfoRef.current.placeId;

      if (!placeId) {
          setError("장소 정보를 확인할 수 없습니다.");
          return;
      }

      setIsAiLoading(true);
      setError(null);
      setLocalAiResponse(null);

      if (import.meta.env.DEV) {
          console.log("[PlaceWikiDetailsView] Edge Function에서 DB 레코드 생성/업데이트 처리");
      }

      const oldAiInfo = wikiData?.ai_practical_info !== '[[LOADING]]' ? wikiData?.ai_practical_info : localAiResponse;

      try {
          if (import.meta.env.DEV) {
              console.log("[PlaceWikiDetailsView] Supabase Edge Function 호출");
          }
          const { data, error: functionError } = await supabase.functions.invoke('update-place-wiki', {
              body: { placeId, locationName: location, oldAiInfo, forceUpdate }
          });

          if (functionError) {
              console.error("[PlaceWikiDetailsView] Edge Function Error:", functionError);
              throw new Error("정보를 가져오는데 실패했습니다.");
          }

          if (import.meta.env.DEV) {
              console.log("[PlaceWikiDetailsView] Edge Function 호출 완료 - 응답 데이터:", data);
          }

          if (data && data.success) {
              setLocalAiResponse(data.aiResponse);
              setLocalUpdatedAt(new Date().toISOString());
          } else {
              throw new Error(data?.error || "AI 응답을 생성하지 못했습니다.");
          }
      } catch (err) {
          console.error('Request Error:', err);
          setError(err.message || "오류가 발생했습니다.");
      } finally {
          setIsAiLoading(false);
      }
    }
  }, [isAiLoading, wikiData, countryName, localAiResponse]);

  useEffect(() => {
    const currentInfo = wikiData?.ai_practical_info;
    const prevInfo = prevAiInfoRef.current;

    if (currentInfo === '[[LOADING]]') {
      setIsAiExpanded(true);
      setIsAiLoading(true);
      setLocalAiResponse(null);
      setError(null);
    } else if (prevInfo === '[[LOADING]]' && currentInfo && currentInfo !== '[[LOADING]]') {
      setLocalAiResponse(currentInfo);
      if (wikiData?.ai_info_updated_at) {
          setLocalUpdatedAt(wikiData.ai_info_updated_at);
      }
      setIsAiLoading(false);
    }

    prevAiInfoRef.current = currentInfo;
  }, [wikiData?.ai_practical_info, wikiData?.ai_info_updated_at]);

  // 좌측 네비게이션과 AI 버튼 상태 동기화
  useEffect(() => {
      window.dispatchEvent(new CustomEvent('ai-expanded-state', { detail: isAiExpanded }));
  }, [isAiExpanded]);

  const scrollToAiSection = useCallback(() => {
      if (aiSectionRef.current) {
          aiSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // 혹시 모를 미세 오차 보정
          setTimeout(() => {
              if (aiSectionRef.current) {
                  aiSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
          }, 400);
      }
  }, []);

  // 좌측 네비게이션에서 스크롤 요청 수신
  useEffect(() => {
      const handleScrollReq = () => {
          setIsAiExpanded(true); // 혹시 닫혀있다면 열기
          scrollToAiSection();
      };
      window.addEventListener('scroll-to-ai-section', handleScrollReq);
      return () => window.removeEventListener('scroll-to-ai-section', handleScrollReq);
  }, [scrollToAiSection]);

  useEffect(() => {
      const handleRemoteRequest = (e) => {
          handleRequestAiInfo(e.detail?.placeName, e.detail?.forceUpdate);
      };
      window.addEventListener('request-ai-info', handleRemoteRequest);
      return () => window.removeEventListener('request-ai-info', handleRemoteRequest);
  }, [handleRequestAiInfo]);

  const images = galleryData?.images || [];
  const heroImage = images.length > 0 ? images[0] : null;
  const contentImages = useMemo(() => images.slice(1), [images]);
  /** 섹션 삽화 과다 시 하단 갤러리가 비는 것 방지 · 하단은 최대 22장 */
  const sectionImageCount = Math.min(
    wikiData?.sections?.length || 0,
    4,
    contentImages.length,
  );
  const galleryImages = useMemo(
    () => contentImages.slice(sectionImageCount).slice(0, 22),
    [contentImages, sectionImageCount],
  );
  const wikiPlaceKey = useMemo(() => resolveGalleryPlaceKey(location), [location]);

  const canGoLightboxPrev = lightboxIndex > 0;
  const canGoLightboxNext = lightboxIndex < galleryImages.length - 1;

  const goLightboxPrev = useCallback((e) => {
    e?.stopPropagation?.();
    if (lightboxIndex <= 0) return;
    const newIndex = lightboxIndex - 1;
    setLightboxIndex(newIndex);
    setLightboxImg(galleryImages[newIndex]);
  }, [lightboxIndex, galleryImages]);

  const goLightboxNext = useCallback((e) => {
    e?.stopPropagation?.();
    if (lightboxIndex >= galleryImages.length - 1) return;
    const newIndex = lightboxIndex + 1;
    setLightboxIndex(newIndex);
    setLightboxImg(galleryImages[newIndex]);
  }, [lightboxIndex, galleryImages]);

  const renderLightboxAttribution = (wrapperClassName, linkClassName = '') => {
    if (!lightboxAttribution || !lightboxImg) return null;
    return (
      <span className={wrapperClassName} title={lightboxAttribution.title}>
        <span>Photo by</span>
        <GalleryAttributionLink
          href={lightboxAttribution.photographerHref || lightboxAttribution.href}
          location={location}
          image={lightboxImg}
          context="wiki"
          lightboxIndex={lightboxIndex}
          className={`truncate font-semibold text-white hover:underline ${linkClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {lightboxAttribution.authorName}
        </GalleryAttributionLink>
        <span>on</span>
        <GalleryAttributionLink
          href={lightboxAttribution.providerHref}
          location={location}
          image={lightboxImg}
          context="wiki"
          lightboxIndex={lightboxIndex}
          className={`shrink-0 font-semibold text-white hover:underline ${linkClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {lightboxAttribution.providerName}
        </GalleryAttributionLink>
      </span>
    );
  };

  useEffect(() => {
    if (!isActive || !wikiPlaceKey || galleryImages.length === 0) return undefined;

    const pending = consumeGalleryAttributionReturnState(wikiPlaceKey, 'wiki');
    if (!pending) return undefined;

    let img = findImageForReturnState(galleryImages, pending);
    if (!img && typeof pending.lightboxIndex === 'number' && galleryImages[pending.lightboxIndex]) {
      img = galleryImages[pending.lightboxIndex];
    }
    if (img) {
      const idx = galleryImages.findIndex((item) => String(item.id) === String(img.id));
      setLightboxImg(img);
      setLightboxIndex(idx >= 0 ? idx : pending.lightboxIndex ?? 0);
    }
    return undefined;
  }, [isActive, wikiPlaceKey, galleryImages]);

  useEffect(() => {
    if (!isActive || !wikiPlaceKey) return undefined;

    const onPageShow = (event) => {
      if (!event.persisted) return;
      const pending = readGalleryAttributionReturnState();
      if (!pending || pending.placeKey !== wikiPlaceKey || pending.context !== 'wiki') return;
      clearGalleryAttributionReturnState();
    };

    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [isActive, wikiPlaceKey]);

  // 요약 텍스트에서 인용구(첫 문장) 추출
  let pullQuote = "";
  let remainingSummary = "";
  if (wikiData?.summary && wikiData.summary !== '[[LOADING]]') {
      remainingSummary = wikiData.summary;
      const match = wikiData.summary.match(/^([^.!?]+[.!?]+)\s*(.*)$/);
      if (match) {
          pullQuote = match[1];
          remainingSummary = match[2];
      }
  }

  // 본문 내 [소제목] 스타일링 및 불필요한 기호 제거 함수
  const renderContentWithSubtitles = (content) => {
      if (!content) return null;

      // 모든 형태의 bullet point (•) 완전 제거
      let cleanContent = content
          .replace(/\n\s*•\s*\n/g, '\n\n')  // 줄바꿈 사이의 bullet
          .replace(/^\s*•\s*$/gm, '')        // 단독 줄의 bullet
          .replace(/•/g, '')                  // 남아있는 모든 bullet 제거
          .replace(/\n{3,}/g, '\n\n');       // 과도한 줄바꿈 정리

      const parts = cleanContent.split(/(\[[^\]]+\])/g);

      return parts.map((part, index) => {
          if (part.startsWith('[') && part.endsWith(']')) {
              return (
                  <span key={index} className="block text-amber-400/90 font-bold text-sm md:text-base mt-6 mb-1 tracking-wider">
                      {part}
                  </span>
              );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
      });
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-[#05070a]">
    <div className={mobilePlaceHeaderSpacerClass} aria-hidden="true" />
    <div
        ref={containerRef}
        className={`flex-1 min-h-0 w-full flex flex-col overflow-y-auto overflow-x-hidden text-white custom-scrollbar relative ${placeScrollSurfaceClass}`}
    >
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}</style>

        {mobileSecondaryNav && (
            <div className={`md:hidden shrink-0 border-b border-white/10 bg-[#05070a] ${mobileLandscapeChromeHidden}`}>
                {mobileSecondaryNav}
            </div>
        )}

        {/* Hero Section */}
        {heroImage && (
            <div className="relative w-full overflow-hidden flex-shrink-0">
                <div className={`${mobileSecondaryNav ? 'h-0' : 'h-16 max-md:landscape:h-0'} md:h-0 bg-[#05070a]`} />

                <div className="relative w-full h-[40vh] md:h-[50vh]">
                    <img
                        src={heroImage.urls?.regular || heroImage.urls?.full}
                        alt={heroImage.alt_description || placeName || 'Hero image'}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 pb-8">
                        <div className="max-w-3xl mx-auto">
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                                {placeName || wikiData?.title}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className={`max-w-3xl mx-auto w-full px-6 md:px-0 pb-8 md:pb-32 max-md:landscape:px-4 max-md:landscape:pb-4 ${!heroImage ? (mobileSecondaryNav ? 'pt-6 md:pt-0' : 'pt-[96px] max-md:landscape:pt-4') : 'pt-8'}`}>

            {/* 타이틀이 Hero 이미지 없는 경우를 대비한 Fallback */}
            {!heroImage && (
                <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter drop-shadow-2xl">
                    {placeName || wikiData?.title}
                </h1>
            )}

            {/* 소제목 */}
            <div className="flex items-center gap-3 text-amber-400 text-lg md:text-xl font-bold mb-8 pb-4 border-b border-white/10">
                <BookOpen size={24} />
                <span>GATEO 여행 스케치</span>
            </div>

            {/* 메인 레이아웃 (단일 컬럼) */}
            <div className="space-y-12">

                {isWikiLoading ? (
                    <div className="space-y-8 animate-pulse">
                        <div className="h-32 bg-white/5 rounded-2xl border border-white/10 w-full"></div>
                        <div className="space-y-4 pt-8 border-t border-white/10">
                            <div className="h-8 bg-white/10 rounded w-1/3"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-white/5 rounded w-full"></div>
                                <div className="h-4 bg-white/5 rounded w-5/6"></div>
                                <div className="h-4 bg-white/5 rounded w-4/6"></div>
                            </div>
                        </div>
                    </div>
                ) : isMagazineLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] py-12 animate-fade-in">
                        <div className="w-full max-w-md space-y-6">
                            <div className="flex justify-between items-end px-2">
                                <span className="text-base font-bold text-gray-300">매거진 작성 중</span>
                                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                                    {Math.round((magazineLoadingStep / (MAGAZINE_LOADING_MESSAGES.length - 1)) * 100)}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
                                    style={{ width: `${(magazineLoadingStep / (MAGAZINE_LOADING_MESSAGES.length - 1)) * 100}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400 font-medium justify-center mt-6">
                                <Loader2 size={16} className="animate-spin text-amber-400" />
                                <span className="animate-pulse break-keep">{MAGAZINE_LOADING_MESSAGES[magazineLoadingStep]}</span>
                            </div>
                            <p className="text-xs text-gray-500 text-center break-keep">
                                피처 기사 분량이 길어 1~2분 정도 걸릴 수 있습니다. 탭을 닫아도 생성이 이어집니다.
                            </p>
                        </div>
                    </div>
                ) : hasMagazineContent(wikiData) ? (
                    <div className="space-y-12 animate-fade-in">

                        {/* 인용구 (Pull Quote) */}
                        {pullQuote && (
                            <div className="relative pl-8 md:pl-12 py-2">
                                <Quote size={48} className="absolute left-0 top-0 text-amber-500/20 -translate-y-2" />
                                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-amber-50 leading-snug tracking-tight break-keep">
                                    {pullQuote}
                                </p>
                            </div>
                        )}

                        {/* 요약 본문 */}
                        {remainingSummary && (
                            <p className="text-base md:text-lg text-gray-200 leading-[1.8] tracking-wide whitespace-pre-line break-keep font-light">
                                {remainingSummary}
                            </p>
                        )}

                        {/* 위치 지도 — Mapbox Static (요약글 아래, 본문 진입 전) */}
                        <PlaceWikiLocatorMap location={location} isActive={isActive} />

                        {/* 위키 섹션들 */}
                        <div className="space-y-16 pt-8">
                            {wikiData.sections && wikiData.sections.map((sec, idx) => {
                                const imageForSection = idx < sectionImageCount ? contentImages[idx] : null;

                                return (
                                    <section key={idx} id={`wiki-section-${idx}`} className="scroll-mt-8 group">
                                        {/* 섹션 헤더 (이미지가 있으면 배경으로 오버랩, 없으면 텍스트만) */}
                                        {imageForSection ? (
                                            <figure
                                                className="mb-8 rounded-2xl md:rounded-3xl overflow-hidden relative animate-fade-in bg-[#05070a] max-h-[75vh] md:max-h-[85vh] shadow-xl border border-white/5"
                                                style={imageForSection.width && imageForSection.height ? { aspectRatio: `${imageForSection.width} / ${imageForSection.height}` } : {}}
                                            >
                                                <img
                                                    src={imageForSection.urls?.regular || imageForSection.urls?.small}
                                                    alt={imageForSection.alt_description || `${sec.title} 관련 이미지`}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    loading={idx === 0 ? "eager" : "lazy"}
                                                    fetchPriority={idx === 0 ? "high" : "auto"}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/30 to-transparent" />
                                                <div className="absolute bottom-0 left-0 w-full p-5 md:p-8">
                                                    <h3 className="text-xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3 drop-shadow-lg">
                                                        <span className="w-5 md:w-6 h-[2px] md:h-[3px] bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                                                        {sec.title}
                                                    </h3>
                                                </div>
                                            </figure>
                                        ) : (
                                            <h3 className="text-xl md:text-2xl font-bold mb-6 text-white tracking-tight flex items-center gap-3">
                                                <span className="w-6 h-[2px] bg-amber-500 rounded-full"></span>
                                                {sec.title}
                                            </h3>
                                        )}

                                        {/* 본문 텍스트 */}
                                        <div className="text-base md:text-lg text-gray-300 leading-[1.9] tracking-wide whitespace-pre-line break-keep font-light md:px-2">
                                            {renderContentWithSubtitles(sec.content)}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>

                        {/* 하단 갤러리 그리드 (위키 섹션 직후) — 비정형 aspectRatio 배열 */}
                        {galleryImages.length > 0 && (
                            <div className="mt-24 pt-12 border-t border-white/10" data-gallery-section>
                                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white tracking-tight">
                                    <Camera size={24} className="text-gray-400" />
                                    <span>포토 갤러리</span>
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                                    {galleryImages.map((img, i) => (
                                        <div
                                            key={img.id || i}
                                            className="rounded-2xl overflow-hidden relative cursor-pointer bg-white/5"
                                            style={img.width && img.height ? { aspectRatio: `${img.width} / ${img.height}` } : {}}
                                            onClick={() => {
                                                setLightboxImg(img);
                                                setLightboxIndex(i);
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setLightboxImg(img);
                                                    setLightboxIndex(i);
                                                }
                                            }}
                                            aria-label={`${img.alt_description || '갤러리 이미지'} 확대하기`}
                                        >
                                            <img
                                                src={img.urls?.small}
                                                alt={img.alt_description || 'Gallery image'}
                                                className="w-full h-full object-cover absolute inset-0"
                                                loading="lazy"
                                                width={img.width}
                                                height={img.height}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="flex flex-col items-stretch min-h-[40vh] text-gray-400 gap-8 animate-fade-in py-10">
                        {(magazineIntro || magazineIntroLoading) && (
                            <div className="px-1 md:px-2 pb-4 border-b border-white/10">
                                {magazineIntroLoading && !magazineIntro ? (
                                    <div className="space-y-3 animate-pulse py-1">
                                        <div className="h-6 bg-white/5 rounded w-full" />
                                        <div className="h-6 bg-white/5 rounded w-5/6" />
                                        <div className="h-6 bg-white/5 rounded w-4/6" />
                                    </div>
                                ) : (
                                    <PlaceOverviewProse text={magazineIntro} variant="lede" />
                                )}
                            </div>
                        )}
                        <div className="flex flex-col items-center gap-5">
                            <BookOpen size={48} className="opacity-20 text-amber-400" />
                            <p className="text-base text-gray-300 font-medium text-center px-4 break-keep">
                                아직 이 장소의 매거진이 준비되지 않았습니다.
                            </p>
                            {parentHasMagazine && parentSketch?.place && onNavigateToPlace ? (
                                <button
                                    type="button"
                                    onClick={() => onNavigateToPlace(parentSketch.place, { tab: 'wiki' })}
                                    className="group relative flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-sky-300/45 bg-gradient-to-r from-sky-500/25 via-cyan-400/20 to-emerald-400/25 text-sky-50 shadow-[0_0_24px_rgba(56,189,248,0.18)] hover:from-sky-400/35 hover:via-cyan-300/30 hover:to-emerald-300/35 hover:border-sky-200/60 hover:shadow-[0_0_28px_rgba(56,189,248,0.28)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 min-h-[48px]"
                                >
                                    <Sparkles size={16} className="text-cyan-200 shrink-0 group-hover:rotate-12 transition-transform duration-200" />
                                    <span className="text-sm md:text-[15px] font-bold tracking-wide break-keep">
                                        {parentSketch.label} 여행 스케치 보기
                                    </span>
                                    <ChevronRight size={16} className="text-sky-100/90 shrink-0 group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden="true" />
                                </button>
                            ) : null}
                            <p className="text-[13px] md:text-sm text-gray-300/90 text-center px-4 leading-relaxed break-keep">
                                AI 에디터가 하이엔드 여행 스케치 피처 기사를 작성합니다.
                            </p>
                            {magazineError && (
                                <p className="text-sm text-red-400/90 text-center px-4 break-keep">{magazineError}</p>
                            )}
                            <button
                                type="button"
                                onClick={handleGenerateMagazine}
                                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/40 hover:to-orange-600/40 border border-amber-500/40 rounded-2xl transition-all duration-300 shadow-lg min-h-[48px]"
                            >
                                <PenLine size={18} className="text-amber-300" />
                                <span className="text-sm md:text-base font-bold text-amber-100 tracking-wide">
                                    {magazineError ? '다시 생성하기' : '매거진 생성하기'}
                                </span>
                            </button>
                        </div>
                        <PlaceWikiLocatorMap location={location} isActive={isActive} />
                    </div>
                )}

                {/* AI 로컬 왓슨 섹션 (하단 갤러리 아래) */}
                {isAiExpanded && (
                    <div ref={aiSectionRef} className="mt-16 bg-[#0F1115] border border-blue-500/20 rounded-3xl p-6 md:p-10 animate-fade-in-up shadow-2xl scroll-mt-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl">
                                    <Sparkles size={28} className="text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">로컬 왓슨 노트</h3>
                                    <p className="text-sm text-gray-400 mt-1">AI가 분석한 실전 여행 팁</p>
                                </div>
                            </div>
                            {(!isAiLoading && localAiResponse) && (
                                <button
                                    onClick={() => handleRequestAiInfo(placeName || wikiData?.title, true)}
                                    className="p-2.5 hover:bg-blue-500/10 text-blue-400/70 hover:text-blue-400 rounded-xl transition-all border border-transparent hover:border-blue-500/30 flex items-center gap-2 group"
                                    title="AI 정보 강제 갱신"
                                >
                                    <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                                    <span className="text-xs font-bold hidden md:inline">최신화</span>
                                </button>
                            )}
                        </div>

                        {!localAiResponse && isAiLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-full max-w-md space-y-6">
                                    <div className="flex justify-between items-end px-2">
                                        <span className="text-base font-bold text-gray-300">
                                            {isUpdatingExisting ? "AI 정보 점검 중" : "AI 정보 생성 중"}
                                        </span>
                                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                            {Math.round((loadingStep / (currentMessages.length - 1)) * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                                            style={{ width: `${(loadingStep / (currentMessages.length - 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-400 font-medium justify-center mt-6">
                                        <Loader2 size={16} className="animate-spin text-blue-400" />
                                        <span className="animate-pulse">{currentMessages[loadingStep]}</span>
                                    </div>
                                </div>
                            </div>
                        ) : !localAiResponse && error ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-gray-400">
                                <p className="text-base">정보를 불러오는 중 문제가 발생했습니다.</p>
                                <button
                                    onClick={() => handleRequestAiInfo(placeName || wikiData?.title)}
                                    className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10 font-medium"
                                >
                                    <RefreshCw size={18} />
                                    <span>다시 시도</span>
                                </button>
                            </div>
                        ) : localAiResponse ? (
                            <div className="flex flex-col gap-8">
                                <div className="text-base md:text-lg text-gray-300 leading-[1.9] tracking-wide whitespace-pre-line break-keep font-light">
                                    <CopyableText text={parseAiPracticalInfo(localAiResponse).wikiContent || localAiResponse} locationName={placeName || wikiData?.title} type="wiki" />
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="text-xs text-gray-500 font-medium">
                                        {(localUpdatedAt || wikiData?.ai_info_updated_at) && wikiData?.ai_practical_info !== '[[LOADING]]' ?
                                            `마지막 업데이트: ${new Date(localUpdatedAt || wikiData.ai_info_updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`
                                            : ''}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* 로컬 왓슨 하단 갤러리 힌트 버튼 */}
                        {galleryImages.length > 0 && localAiResponse && !isAiLoading && (
                            <div className="mt-8 pt-8 border-t border-white/5 flex justify-center" data-gallery-hint>
                                <button
                                    onClick={() => {
                                        const gallerySection = document.querySelector('[data-gallery-section]');
                                        if (gallerySection) {
                                            gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }}
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 rounded-2xl border border-purple-500/30 transition-all duration-300 group shadow-lg min-h-[44px] w-full md:w-auto"
                                    aria-label="포토 갤러리로 이동"
                                >
                                    <Camera size={22} className="text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm md:text-base font-bold text-purple-300 group-hover:text-purple-200 tracking-wide">
                                        포토 갤러리 보기 ({galleryImages.length}장)
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>

        </div>
    </div>

            {/* 하단 AI 버튼 (모바일) — 스크롤 컨테이너 밖 flex 푸터 (iOS fixed-in-scroll 터치 간섭 방지) */}
            <div className={`md:hidden shrink-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-[#05070a]/95 backdrop-blur-xl border-t border-white/10 flex gap-2 ${mobileLandscapeChromeHidden}`}>
                <button
                    type="button"
                    onClick={() => {
                        if (isAiExpanded) {
                            if (aiSectionRef.current) {
                                aiSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        } else {
                            handleRequestAiInfo(placeName || wikiData?.title);
                        }
                    }}
                    className={`group flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-xl transition-all duration-300 shadow-sm min-h-[44px] ${matchedPackage ? 'flex-1' : 'w-full'}`}
                >
                    <Sparkles size={16} className="text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-[11px] sm:text-xs font-medium text-gray-200 tracking-wide truncate">
                        {isAiExpanded ? '로컬 왓슨' : '제미나이 묻기'}
                    </span>
                </button>

                {matchedPackage && (
                    <button
                        type="button"
                        onClick={onOpenPackage}
                        className="flex-1 group flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-300 shadow-sm border bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500/90 hover:to-blue-500/90 border-purple-400/50 min-h-[44px]"
                    >
                        <Briefcase size={16} className="text-purple-100 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-[11px] sm:text-xs font-medium text-white tracking-wide truncate">
                            패키지 여행
                        </span>
                    </button>
                )}
            </div>

        {/* 맨 위로 가기 버튼 */}
        {scrollY > 500 && (
            <button
                onClick={scrollToTop}
                className="fixed bottom-24 md:bottom-12 right-6 md:right-12 p-3.5 bg-blue-600/80 hover:bg-blue-500 text-white rounded-full shadow-2xl backdrop-blur-md transition-all duration-300 z-[170] group animate-fade-in"
                aria-label="맨 위로 가기"
            >
                <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />
            </button>
        )}

        {/* 라이트박스 모달 — 갤러리 탭 개별 사진 UI와 동일 톤 (body 포털) */}
        {lightboxImg && createPortal(
            <div
                className="fixed inset-0 z-[9999] h-[100dvh] min-h-[100svh] w-screen overflow-hidden bg-black animate-fade-in"
                onClick={() => setLightboxImg(null)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') setLightboxImg(null);
                    if (e.key === 'ArrowLeft') goLightboxPrev(e);
                    if (e.key === 'ArrowRight') goLightboxNext(e);
                }}
                role="dialog"
                aria-modal="true"
                aria-label="이미지 확대 보기"
                tabIndex={-1}
            >
                <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
                        <img
                            src={lightboxImg.urls?.regular || lightboxImg.urls?.small}
                            alt={lightboxImg.alt_description || 'Gallery image'}
                            className="relative max-w-[90%] max-h-[90%] object-contain shadow-2xl rounded-lg select-none animate-fade-in"
                        />
                    </div>

                    {(canGoLightboxPrev || canGoLightboxNext) && (
                        <div
                            className="absolute inset-x-0 bottom-4 z-[220] flex items-center justify-center gap-[calc(0.75rem+3rem)] px-4 md:bottom-0 md:gap-[calc(1rem+2.75rem)] md:px-6 md:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:pt-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={goLightboxPrev}
                                disabled={!canGoLightboxPrev}
                                aria-label="이전 사진"
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/80 text-white shadow-[0_4px_24px_rgba(0,0,0,0.55)] ring-2 ring-white/25 backdrop-blur-md transition-all touch-manipulation active:scale-95 md:h-11 md:w-11 ${
                                    canGoLightboxPrev ? 'hover:bg-blue-600/90 hover:border-blue-300/60' : 'opacity-45'
                                }`}
                            >
                                <ChevronLeftIcon className="h-7 w-7 md:h-6 md:w-6" strokeWidth={2.5} />
                            </button>

                            <div className="flex min-w-0 items-center justify-center gap-3">
                                <span
                                    className="shrink-0 rounded-full border border-white/10 bg-black/50 px-3.5 py-1.5 text-sm font-semibold tabular-nums tracking-wide text-white/90 shadow-xl backdrop-blur-md"
                                    aria-live="polite"
                                    aria-atomic="true"
                                >
                                    {lightboxIndex + 1} / {galleryImages.length}
                                </span>
                                {handleLightboxDownload && (
                                    <button
                                        type="button"
                                        onClick={() => handleLightboxDownload(lightboxImg)}
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/90 backdrop-blur-md transition-all hover:bg-blue-600 hover:text-white"
                                        title="이미지 다운로드"
                                        aria-label="이미지 다운로드"
                                    >
                                        <Download size={20} />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={goLightboxNext}
                                disabled={!canGoLightboxNext}
                                aria-label="다음 사진"
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/80 text-white shadow-[0_4px_24px_rgba(0,0,0,0.55)] ring-2 ring-white/25 backdrop-blur-md transition-all touch-manipulation active:scale-95 md:h-11 md:w-11 ${
                                    canGoLightboxNext ? 'hover:bg-blue-600/90 hover:border-blue-300/60' : 'opacity-45'
                                }`}
                            >
                                <ChevronRight className="h-7 w-7 md:h-6 md:w-6" strokeWidth={2.5} />
                            </button>
                        </div>
                    )}

                    {lightboxAttribution && (
                        <div
                            className="absolute z-[220] max-w-[min(calc(100%-7.5rem),38rem)] top-4 left-4 md:top-[max(0.5rem,env(safe-area-inset-top,0px))] md:left-[max(0.75rem,5%)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {renderLightboxAttribution(
                                'inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white md:px-4 md:py-2 md:text-sm'
                            )}
                        </div>
                    )}

                    <div
                        className="absolute z-[220] flex items-start gap-3 top-4 right-4 md:top-[max(0.5rem,env(safe-area-inset-top,0px))] md:right-3 justify-end"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setLightboxImg(null)}
                            aria-label="닫기"
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/75 text-white shadow-[0_4px_24px_rgba(0,0,0,0.55)] ring-2 ring-white/25 backdrop-blur-md transition-all hover:border-red-300/60 hover:bg-red-500/90 hover:ring-red-300/40"
                        >
                            <X size={22} strokeWidth={2.5} />
                        </button>
                    </div>

                    {lightboxCaption && (
                        <div
                            className="md:hidden absolute left-0 right-0 top-16 z-[205] px-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="max-h-[30vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/55 px-3.5 py-3 backdrop-blur-md shadow-lg">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-300/90 mb-1.5 flex items-center gap-1.5">
                                    <ImageIcon size={12} className="shrink-0 opacity-90" aria-hidden />
                                    사진 노트
                                </p>
                                <p className="text-sm text-gray-100/95 leading-relaxed whitespace-pre-line">{lightboxCaption}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>,
            document.body
        )}
    </div>
  );
};

export default PlaceWikiDetailsView;
