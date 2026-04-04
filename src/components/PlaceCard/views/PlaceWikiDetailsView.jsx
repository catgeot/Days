import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Sparkles, Loader2, RefreshCw, ChevronLeft, Quote, Camera, ArrowUp, X, ChevronLeft as ChevronLeftIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { parseAiPracticalInfo } from '../../../utils/aiDataParser';
import CopyableText from '../common/CopyableText';
import PlaceMiniMap from '../common/PlaceMiniMap';
import { WIKI_AUTO_UPDATE_DAYS } from '../../../shared/constants';

const LOADING_MESSAGES_NEW = [
    "지역 위키백과 정보 분석 및 연동 중...",
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

const PlaceWikiDetailsView = ({ wikiData, isWikiLoading, placeName, countryName, location, galleryData, setMediaMode, isActive }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [localAiResponse, setLocalAiResponse] = useState(null);
  const [localUpdatedAt, setLocalUpdatedAt] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // 라이트박스 상태 (갤러리 이미지만)
  const [lightboxImg, setLightboxImg] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0); // galleryImages 내에서의 인덱스

  const isUpdatingExisting = !!wikiData?.ai_practical_info && wikiData.ai_practical_info !== '[[LOADING]]';
  const currentMessages = isUpdatingExisting ? LOADING_MESSAGES_UPDATE : LOADING_MESSAGES_NEW;

  const aiSectionRef = useRef(null);
  const containerRef = useRef(null);
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

  const requestInfoRef = useRef({ placeName, wikiTitle: wikiData?.title, placeId: wikiData?.place_id || placeName });
  useEffect(() => {
      requestInfoRef.current = { placeName, wikiTitle: wikiData?.title, placeId: wikiData?.place_id || placeName };
  }, [placeName, wikiData]);

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
  }, [isAiLoading, wikiData, countryName]);

  const autoUpdateTriggered = useRef(false);
  useEffect(() => {
      if (isActive && !autoUpdateTriggered.current && wikiData?.ai_practical_info && wikiData.ai_practical_info !== '[[LOADING]]') {
          const lastUpdated = wikiData.ai_info_updated_at;
          if (lastUpdated) {
              const lastDate = new Date(lastUpdated);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - lastDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays > WIKI_AUTO_UPDATE_DAYS) {
                  if (import.meta.env.DEV) {
                      console.log(`[Wiki] ${WIKI_AUTO_UPDATE_DAYS}일 경과 자동 갱신 실행 (${diffDays}일 지남)`);
                  }
                  autoUpdateTriggered.current = true;
                  handleRequestAiInfo(placeName || wikiData.title, true);
              }
          }
      }
  }, [isActive, wikiData?.ai_practical_info, wikiData?.ai_info_updated_at, placeName, handleRequestAiInfo]);

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

  // 매거진 레이아웃을 위한 데이터 가공
  const images = galleryData?.images || [];
  const heroImage = images.length > 0 ? images[0] : null;
  const contentImages = images.slice(1); // 본문 섹션용
  const sectionCount = wikiData?.sections?.length || 0;
  const galleryImages = contentImages.slice(sectionCount); // 하단 갤러리 전용

  // 요약 텍스트에서 인용구(첫 문장) 추출
  let pullQuote = "";
  let remainingSummary = wikiData?.summary || "";
  if (wikiData?.summary) {
      const match = wikiData.summary.match(/^([^.!?]+[.!?]+)\s*(.*)$/);
      if (match) {
          pullQuote = match[1];
          remainingSummary = match[2];
      }
  }

  const scrollToTop = () => {
      if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

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
    <div ref={containerRef} className="w-full h-full flex flex-col overflow-y-auto text-white custom-scrollbar relative bg-[#05070a]">
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}</style>

        {/* Hero Section */}
        {heroImage && (
            <div className="relative w-full overflow-hidden flex-shrink-0">
                {/* 모바일 헤더 공간 확보 */}
                <div className="h-16 md:h-0 bg-[#05070a]"></div>

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

        <div className={`max-w-3xl mx-auto w-full px-6 md:px-0 pb-48 md:pb-32 ${!heroImage ? 'pt-[96px]' : 'pt-8'}`}>

            {/* 타이틀이 Hero 이미지 없는 경우를 대비한 Fallback */}
            {!heroImage && (
                <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter drop-shadow-2xl">
                    {placeName || wikiData?.title}
                </h1>
            )}

            {/* 소제목 */}
            <div className="flex items-center gap-3 text-amber-400 text-lg md:text-xl font-bold mb-8 pb-4 border-b border-white/10">
                <BookOpen size={24} />
                <span>GATEO 매거진 백과</span>
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
                ) : wikiData ? (
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

                        {/* 지도 (요약글 아래, 본문 진입 전) */}
                        {location?.lat && location?.lng && (
                            <div className="bg-white/5 p-2 md:p-4 rounded-3xl border border-white/10 shadow-xl my-12 md:mx-12">
                                <PlaceMiniMap lat={location.lat} lng={location.lng} name={location.name} />
                            </div>
                        )}

                        {/* 위키 섹션들 */}
                        <div className="space-y-16 pt-8">
                            {wikiData.sections && wikiData.sections.map((sec, idx) => {
                                // 각 섹션마다 이미지 1개씩 매칭
                                const imageForSection = idx < contentImages.length ? contentImages[idx] : null;

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

                        {/* 하단 갤러리 그리드 (위키 섹션 직후) */}
                        {galleryImages.length > 0 && (
                            <div className="mt-24 pt-12 border-t border-white/10" data-gallery-section>
                                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white tracking-tight">
                                    <Camera size={24} className="text-gray-400" />
                                    <span>포토 갤러리</span>
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                                    {galleryImages.map((img, i) => (
                                        <div
                                            key={i}
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
                    <div className="flex flex-col items-center justify-center h-[40vh] text-gray-500 gap-4 animate-fade-in">
                        <BookOpen size={48} className="opacity-20" />
                        <p className="text-center">아직 이 장소의 매거진 정보가 준비되지 않았습니다.</p>
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

            {/* 하단 AI 버튼 (모바일 전용 푸터 고정) */}
            <div className="fixed md:hidden bottom-0 left-0 right-0 p-4 z-[160] bg-[#05070a]/95 backdrop-blur-xl border-t border-white/10">
                <button
                    onClick={() => {
                        if (isAiExpanded) {
                            if (aiSectionRef.current) {
                                aiSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        } else {
                            handleRequestAiInfo(placeName || wikiData?.title);
                        }
                    }}
                    className="group flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-2xl transition-all duration-300 shadow-lg w-full min-h-[56px]"
                >
                    <Sparkles size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-gray-200 tracking-wide">
                        {isAiExpanded ? '로컬 왓슨 정보 보기' : 'AI에게 안전 로컬 정보 묻기'}
                    </span>
                </button>
            </div>
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

        {/* 라이트박스 모달 */}
        {lightboxImg && (
            <div
                className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center backdrop-blur-sm animate-fade-in"
                onClick={() => setLightboxImg(null)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') setLightboxImg(null);
                    if (e.key === 'ArrowLeft') {
                        const newIndex = lightboxIndex - 1;
                        if (newIndex >= 0) {
                            setLightboxIndex(newIndex);
                            setLightboxImg(galleryImages[newIndex]);
                        }
                    }
                    if (e.key === 'ArrowRight') {
                        const newIndex = lightboxIndex + 1;
                        if (newIndex < galleryImages.length) {
                            setLightboxIndex(newIndex);
                            setLightboxImg(galleryImages[newIndex]);
                        }
                    }
                }}
                role="dialog"
                aria-modal="true"
                aria-label="이미지 확대 보기"
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImg(null);
                    }}
                    className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 z-10 group"
                    aria-label="닫기"
                >
                    <X size={24} className="text-white group-hover:rotate-90 transition-transform" />
                </button>

                {/* 좌측 네비게이션 */}
                {lightboxIndex > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const newIndex = lightboxIndex - 1;
                            setLightboxIndex(newIndex);
                            setLightboxImg(galleryImages[newIndex]);
                        }}
                        className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 z-10 group"
                        aria-label="이전 이미지"
                    >
                        <ChevronLeftIcon size={32} className="text-white group-hover:-translate-x-1 transition-transform" />
                    </button>
                )}

                {/* 우측 네비게이션 */}
                {lightboxIndex < galleryImages.length - 1 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const newIndex = lightboxIndex + 1;
                            setLightboxIndex(newIndex);
                            setLightboxImg(galleryImages[newIndex]);
                        }}
                        className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 z-10 group"
                        aria-label="다음 이미지"
                    >
                        <ChevronRight size={32} className="text-white group-hover:translate-x-1 transition-transform" />
                    </button>
                )}

                {/* 이미지 */}
                <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                    <img
                        src={lightboxImg.urls?.regular || lightboxImg.urls?.small}
                        alt={lightboxImg.alt_description || 'Gallery image'}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    />

                    {/* 이미지 정보 (하단) */}
                    {(lightboxImg.user?.name || lightboxImg.alt_description) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                            {lightboxImg.alt_description && (
                                <p className="text-white/90 text-sm mb-1">{lightboxImg.alt_description}</p>
                            )}
                            {lightboxImg.user?.name && (
                                <p className="text-white/60 text-xs">
                                    Photo by {lightboxImg.user.name}
                                    {lightboxImg.user.links?.html && (
                                        <a
                                            href={lightboxImg.user.links.html}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-2 underline hover:text-white/80"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            on Unsplash
                                        </a>
                                    )}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* 이미지 카운터 */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full">
                    <p className="text-white/80 text-sm font-medium">
                        {lightboxIndex + 1} / {galleryImages.length}
                    </p>
                </div>
            </div>
        )}
    </div>
  );
};

export default PlaceWikiDetailsView;
