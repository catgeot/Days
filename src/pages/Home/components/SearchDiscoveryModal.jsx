import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Search, X, Compass, Globe2, Layers, Map, ArrowUp, Users, Palmtree } from 'lucide-react';
import { TRAVEL_SPOTS } from '../data/travelSpots';
import { TRIPLINK_PACKAGES } from '../data/tripLinkPackages';

// 분리된 컴포넌트 및 유틸리티 import
import { CONTINENTS, THEMES, CATEGORY_LABELS, CATEGORY_COLORS, TRIPLINK_DYNAMIC_BANNERS } from './SearchDiscovery/constants';
import { getDailySeed, shuffleWithSeed } from './SearchDiscovery/utils';
import SpotThumbnailCard from './SearchDiscovery/SpotThumbnailCard';
import CurationSection from './SearchDiscovery/CurationSection';
import TripLinkDynamicBanner from './SearchDiscovery/TripLinkDynamicBanner';

const SearchDiscoveryModal = ({ isOpen, onClose, onSelect, onSearch, initialQuery = '', isFromPlaceCard = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState(initialQuery);
  const [filterMode, setFilterMode] = useState('theme');
  const [selectedContinent, setSelectedContinent] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  // URL Path 분석하여 상태 동기화
  useEffect(() => {
    if (!isOpen) return;

    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'explore') {
      const primaryParam = pathParts[2]; // /explore/:primaryParam
      const secondaryParam = pathParts[3]; // /explore/:primaryParam/:secondaryParam

      if (primaryParam) {
        const isContinent = CONTINENTS.some(c => c.id === primaryParam);
        const isTheme = THEMES.some(t => t.id === primaryParam);

        if (isContinent) {
          setFilterMode('continent');
          setSelectedContinent(primaryParam);
          setSelectedTheme('all');
          if (secondaryParam && THEMES.some(t => t.id === secondaryParam)) {
            setSelectedSubGroup(secondaryParam);
          } else {
            setSelectedSubGroup(null);
          }
        } else if (isTheme) {
          setFilterMode('theme');
          setSelectedTheme(primaryParam);
          setSelectedContinent('all');
          if (secondaryParam && CONTINENTS.some(c => c.id === secondaryParam)) {
            setSelectedSubGroup(secondaryParam);
          } else {
            setSelectedSubGroup(null);
          }
        }
      } else {
        // 기본 /explore 접속 시
        setSelectedContinent('all');
        setSelectedTheme('all');
        setSelectedSubGroup(null);
      }
    }
  }, [location.pathname, isOpen]);

  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const isSearching = query.trim().length > 0;
  const isCurationMode = !isSearching && selectedContinent === 'all' && selectedTheme === 'all';

  useEffect(() => {
    if (isOpen) {
      setQuery(''); // 모달 열릴 때마다 항상 검색어 초기화
      // 모바일 키보드 자동 올림 방지를 위해 focus() 제거
      document.body.style.overflow = 'hidden';
      setSelectedSubGroup(null);
    } else {
      document.body.style.overflow = '';
      setFilterMode('theme');
      setSelectedContinent('all');
      setSelectedTheme('all');
      setSelectedSubGroup(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    navigate('/explore'); // 필터 모드를 바꾸면 일단 전체보기로 초기화
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinentSelect = (id) => {
    if (id === 'all') {
      navigate('/explore');
    } else {
      navigate(`/explore/${id}`);
    }
  };

  const handleThemeSelect = (id) => {
    if (id === 'all') {
      navigate('/explore');
    } else {
      navigate(`/explore/${id}`);
    }
  };

  const handleSpotSelect = (spot) => {
    onSelect(spot);
  };

  const handleSearchSubmit = async () => {
    if (query.trim() === '' || !onSearch) return;
    setIsAILoading(true);
    try {
      await onSearch(query.trim());
    } finally {
      setIsAILoading(false);
    }
  };

  const filteredSpots = useMemo(() => {
    let result = TRAVEL_SPOTS;
    if (isSearching) {
      const lowerQuery = query.toLowerCase().trim();
      result = result.filter(spot =>
        (spot.name || '').includes(lowerQuery) ||
        (spot.name_en || '').toLowerCase().includes(lowerQuery) ||
        (spot.country || '').includes(lowerQuery) ||
        (spot.country_en || '').toLowerCase().includes(lowerQuery) ||
        (spot.keywords && spot.keywords.some(k => k.includes(lowerQuery))) ||
        (CATEGORY_LABELS[spot.primaryCategory] || '').includes(lowerQuery)
      );
      return [...result].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else {
      if (filterMode === 'continent' && selectedContinent !== 'all') {
        result = result.filter(spot => spot.continent === selectedContinent);
      } else if (filterMode === 'theme' && selectedTheme !== 'all') {
        result = result.filter(spot => spot.primaryCategory === selectedTheme);
      }
      return [...result].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }
  }, [query, filterMode, selectedContinent, selectedTheme, isSearching]);

  // 일일 무작위 셔플이 적용된 큐레이션 데이터
  const curationData = useMemo(() => {
    if (!isCurationMode) return null;
    const seed = getDailySeed();
    const shuffled = shuffleWithSeed(filteredSpots, seed);

    // 테마별 우선 노출 여행지 목록 (기획서 기반, 인기도 및 접근성 순 재정렬)
    const familyTargets = ['오사카', '후쿠오카', '삿포로', '다낭', '나트랑', '방콕', '타이베이', '싱가포르', '장가계', '칭다오', '청도'];
    const longhaulTargets = ['파리', '로마', '인터라켄', '런던', '프라하', '부다페스트', '두브로브니크', '바르셀로나', '마드리드', '밀라노', '이스탄불', '로스앤젤레스', '샌프란시스코', '시드니', '오클랜드', '두바이'];
    const resortTargets = ['괌', '사이판', '보라카이', '세부', '발리', '푸꾸옥', '코타키나발루', '하와이', '호놀룰루', '몰디브', '칸쿤'];

    const getSpotsByTargets = (targets, fallbackFilter) => {
      // 1. 기획서에 명시된 타겟(인기도/접근성) 순서대로 먼저 스팟을 추출하여 순서를 강제 보장
      const exactMatches = [];
      targets.forEach(t => {
        const founds = shuffled.filter(s => (s.name || '').includes(t) || (s.keywords && s.keywords.includes(t)));
        founds.forEach(found => {
          if (!exactMatches.find(m => m.id === found.id)) {
            exactMatches.push(found);
          }
        });
      });

      const matched = exactMatches;

      if (matched.length < 10) {
        // 2. 10개가 안 될 경우, 셔플된 나머지 후보군으로 채움
        const fallbacks = shuffled.filter(fallbackFilter).filter(s => !matched.find(m => m.id === s.id));
        return [...matched, ...fallbacks].slice(0, 10);
      }
      return matched.slice(0, 10);
    };

    return {
      trending: getSpotsByTargets(familyTargets, s => s.continent === 'asia' || s.continent === 'oceania'),
      city: getSpotsByTargets(longhaulTargets, s => s.continent === 'europe' || s.continent === 'americas' || s.continent === 'middle-east'),
      healing: getSpotsByTargets(resortTargets, s => s.primaryCategory === 'paradise' || s.primaryCategory === 'nature')
    };
  }, [isCurationMode, filteredSpots]);

  // 사이드바용 메뉴 그룹화
  const filterGroups = useMemo(() => {
    if (isSearching || isCurationMode) return null;

    if (filterMode === 'continent' && selectedContinent !== 'all') {
      return THEMES.filter(t => t.id !== 'all').map(t => ({
        id: t.id,
        label: t.label,
        icon: t.icon,
        spots: filteredSpots.filter(s => s.primaryCategory === t.id)
      })).filter(g => g.spots.length > 0);
    }
    if (filterMode === 'theme' && selectedTheme !== 'all') {
      return CONTINENTS.filter(c => c.id !== 'all').map(c => ({
        id: c.id,
        label: c.label,
        icon: c.icon,
        spots: filteredSpots.filter(s => s.continent === c.id)
      })).filter(g => g.spots.length > 0);
    }
    return null;
  }, [isSearching, isCurationMode, filterMode, selectedContinent, selectedTheme, filteredSpots]);

  // 서브그룹 자동 선택 (전체보기 제거로 인한 로직)
  useEffect(() => {
    if (filterGroups && filterGroups.length > 0) {
      if (!selectedSubGroup || !filterGroups.find(g => g.id === selectedSubGroup)) {
        // 모달을 열거나 탭을 변경했을 때, URL 파라미터가 없으면 첫번째 그룹의 id로 자동 리다이렉트
        const firstGroupId = filterGroups[0].id;
        const currentPrimary = filterMode === 'continent' ? selectedContinent : selectedTheme;
        if (currentPrimary !== 'all') {
           navigate(`/explore/${currentPrimary}/${firstGroupId}`, { replace: true });
        }
      }
    } else if (!filterGroups) {
      // 큐레이션 모드나 검색 모드일 때는 서브그룹 선택 해제
      if (selectedSubGroup !== null) setSelectedSubGroup(null);
    }
  }, [filterGroups, selectedSubGroup, filterMode, selectedContinent, selectedTheme, navigate]);

  // 동적 배너 노출용 adKey 판별 로직
  const bannerAdKey = useMemo(() => {
    if (isSearching) {
       const q = query.toLowerCase();
       if (q.includes('베트남') || q.includes('다낭') || q.includes('나트랑') || q.includes('푸꾸옥')) return TRIPLINK_DYNAMIC_BANNERS.vietnam;
       if (q.includes('일본') || q.includes('북해도') || q.includes('삿포로') || q.includes('홋카이도')) return TRIPLINK_DYNAMIC_BANNERS.hokkaido;
    } else {
       if (selectedContinent === 'asia' || selectedSubGroup === 'asia') return TRIPLINK_DYNAMIC_BANNERS.vietnam;
    }
    return TRIPLINK_DYNAMIC_BANNERS.default;
  }, [query, isSearching, selectedContinent, selectedSubGroup]);

  const handleSubGroupSelect = (id) => {
    const currentPrimary = filterMode === 'continent' ? selectedContinent : selectedTheme;
    navigate(`/explore/${currentPrimary}/${id}`);
  };

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;

    // Top 버튼 표시 (기존 로직)
    if (scrollTop > 300) {
      setShowTopBtn(true);
    } else {
      setShowTopBtn(false);
    }
  };

  const renderContent = () => {
    if (filteredSpots.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 w-full animate-fade-in">
          <div className="relative mb-6 group cursor-pointer" onClick={handleSearchSubmit}>
             <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
             <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:scale-105 transition-transform">
               <Globe2 size={32} className="text-blue-400" />
             </div>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
             <span className="text-blue-400">'{query}'</span> AI 전 세계 탐색
          </h3>
          <p className="text-gray-400 break-keep max-w-md mx-auto text-sm md:text-base leading-relaxed">
             기본 목록에 없는 장소입니다. <br/>
             <strong className="text-gray-200">엔터(Enter) 키</strong>를 누르시거나 <strong className="text-gray-200 cursor-pointer hover:text-blue-400 transition-colors" onClick={handleSearchSubmit}>위의 아이콘</strong>을 클릭하시면, <br/>
             AI가 전 세계 지도를 검색하여 즉시 해당 위치로 비행합니다!
          </p>
        </div>
      );
    }

    const renderDynamicBanner = () => (
      <div className="mb-8 w-full flex justify-center animate-fade-in-up">
        {/* PC: 728x90 */}
        <TripLinkDynamicBanner adKey={bannerAdKey} width={728} height={90} className="rounded-xl shadow-lg border border-white/10 hidden md:flex hover:shadow-blue-500/20 hover:border-blue-500/30 transition-all cursor-pointer bg-white/5" />
        {/* Mobile: 320x50 */}
        <TripLinkDynamicBanner adKey={bannerAdKey} width={320} height={50} className="rounded-xl shadow-lg border border-white/10 md:hidden hover:shadow-blue-500/20 hover:border-blue-500/30 transition-all cursor-pointer bg-white/5" />
      </div>
    );

    // 1. 큐레이션 모드 (검색어 없음, 전체 선택)
    if (isCurationMode && curationData) {
      return (
        <div className="space-y-12 pb-10 w-full pt-4">
          <CurationSection
            title="가볍고 가까운, 완벽한 가족 여행"
            subtitle="가이드와 함께 걷기 편하고 케어가 확실한 아시아 단거리 패키지 추천"
            icon={<div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20"><Users className="text-yellow-400" size={24} /></div>}
            spots={curationData.trending}
            promotedPackages={TRIPLINK_PACKAGES.family}
            delayClass=""
            onSelectSpot={handleSpotSelect}
            onMoreClick={() => handleFilterModeChange('continent')}
          />
          <CurationSection
            title="전문가와 함께하는, 유럽 & 장거리 일주"
            subtitle="교통, 언어, 치안 우려를 해소하는 안전하고 편안한 장거리 패키지 추천"
            icon={<div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20"><Globe2 className="text-blue-400" size={24} /></div>}
            spots={curationData.city}
            promotedPackages={TRIPLINK_PACKAGES.longhaul}
            delayClass="animation-delay-100"
            onSelectSpot={handleSpotSelect}
            onMoreClick={() => handleThemeSelect('urban')}
          />
          <CurationSection
            title="일상의 탈출, 완벽한 에어텔/올인클루시브"
            subtitle="비행기, 숙소, 픽업만 해결하고 자유롭게 즐기는 휴양 패키지 추천"
            icon={<div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20"><Palmtree className="text-cyan-400" size={24} /></div>}
            spots={curationData.healing}
            promotedPackages={TRIPLINK_PACKAGES.resort}
            delayClass="animation-delay-200"
            onSelectSpot={handleSpotSelect}
            onMoreClick={() => handleThemeSelect('paradise')}
          />
        </div>
      );
    }

    // 2. 교차 필터 뷰
    if (!isSearching && filterGroups) {
      const activeGroup = filterGroups.find(g => g.id === selectedSubGroup) || filterGroups[0];
      const displaySpots = activeGroup?.spots || [];
      const currentLabel = activeGroup?.label || '';

      return (
        <div className="w-full animate-fade-in-up pb-20 pt-4">
          {/* 사용자 피드백: 상단 배너 노출 보류 */}
          {/* renderDynamicBanner() */}
          <div className="block">
            {/* Result Stats */}
            <div className="mb-6 text-sm font-medium text-gray-500 flex items-center gap-2">
              <Globe2 size={16} />
              <span>{displaySpots.length}개의 여행지</span>
              <span className="text-gray-700">|</span>
              <span className="text-blue-400 font-bold">{currentLabel}</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 lg:gap-8">
              {displaySpots.map(spot => (
                <SpotThumbnailCard key={spot.id} spot={spot} onClick={handleSpotSelect} isGrid={true} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 3. 검색 결과 (그리드 뷰)
    return (
      <div className="w-full pb-20 pt-4">
        {/* 사용자 피드백: 상단 배너 노출 보류 */}
        {/* renderDynamicBanner() */}
        <div className="mb-6 text-sm font-medium text-gray-500 flex items-center gap-2">
           <Search size={16} />
           <span>'{query}' 검색 결과 {filteredSpots.length}건</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 lg:gap-8">
          {filteredSpots.map(spot => (
            <SpotThumbnailCard key={spot.id} spot={spot} onClick={handleSpotSelect} isGrid={true} />
          ))}
        </div>
      </div>
    );
  };

  const headerContent = (isMobileView) => (
    <div className={`flex flex-col md:flex-row md:items-center gap-4 px-4 md:px-6 py-4 md:py-3 border-b border-white/[0.08] shrink-0 bg-[#0b101a]/80 backdrop-blur-md z-20 transition-all duration-300 overflow-hidden ${
      isMobileView
        ? 'md:hidden'
        : 'hidden md:flex md:max-h-[100px] md:opacity-100'
    }`}>
      {/* 상단 닫기(홈으로) 및 모바일용 필터 토글 */}
      <div className="flex items-center justify-between md:justify-start gap-4">
        <button onClick={onClose} className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors group shrink-0">
          <div className="w-12 h-12 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.08] group-hover:bg-white/[0.1] transition-all group-hover:scale-105 shadow-lg">
            <X size={24} className="md:hidden" />
            <X size={18} className="hidden md:block" />
          </div>
          <span className="font-bold hidden md:block text-base">홈으로</span>
        </button>

        {/* 모바일 전용: 필터 토글 탭 */}
        {isMobileView && !isSearching && (
          <div className="md:hidden flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => handleFilterModeChange('theme')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'theme' ? 'bg-purple-600/20 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.15)]' : 'text-gray-500'
              }`}
            >
              <Layers size={14} /> 테마
            </button>
            <button
              onClick={() => handleFilterModeChange('continent')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'continent' ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'text-gray-500'
              }`}
            >
              <Map size={14} /> 대륙
            </button>
          </div>
        )}
      </div>

      {/* PC 전용: 필터 토글 탭 */}
      {!isMobileView && !isSearching && (
        <div className="hidden md:flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.08] ml-2 shrink-0">
          <button
            onClick={() => handleFilterModeChange('theme')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              filterMode === 'theme' ? 'bg-purple-600/20 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.15)]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Layers size={14} /> 테마별
          </button>
          <button
            onClick={() => handleFilterModeChange('continent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              filterMode === 'continent' ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Map size={14} /> 대륙별
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex-1 max-w-3xl relative flex items-center bg-white/[0.12] border border-white/[0.25] rounded-2xl h-12 md:h-10 overflow-hidden focus-within:border-blue-400/60 focus-within:bg-white/[0.15] focus-within:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-all md:ml-auto">
        <Search size={20} className="text-gray-300 ml-4 md:ml-3 shrink-0 md:w-[18px] md:h-[18px]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearchSubmit();
            }
          }}
          placeholder="어디로 떠나고 싶으신가요?"
          className="w-full bg-transparent text-white px-4 md:px-3 h-full outline-none placeholder-gray-500 text-[16px] md:text-base font-medium"
        />
        {query && (
          <button
             onClick={() => { setQuery(''); inputRef.current?.focus(); }}
             className="p-3 md:p-2 text-gray-400 hover:text-white transition-colors"
          >
             <X size={20} className="md:w-[18px] md:h-[18px]" />
          </button>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col bg-[#0b101a]/95 backdrop-blur-3xl overflow-hidden ${isFromPlaceCard ? '' : 'animate-fade-in'}`}>
      {/* 글로벌 스크롤바 상시 노출을 위한 인라인 스타일 */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar { display: block; height: 12px; width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.3); border-radius: 10px; border: 3px solid transparent; background-clip: padding-box; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.5); border: 2px solid transparent; background-clip: padding-box; }
        }
        .modal-scroll-area::-webkit-scrollbar { display: block; width: 10px; }
        .modal-scroll-area::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-left: 1px solid rgba(255,255,255,0.05); }
        .modal-scroll-area::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
        .modal-scroll-area::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.4); }
      `}} />

      {/* PC 전용 Header */}
      {headerContent(false)}

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden w-full max-w-[1800px] mx-auto relative">

        {/* Left Sidebar (PC 전용 고정 스크롤 영역 - 플로팅 아일랜드 디자인 적용) */}
        {!isSearching && filterGroups && (
          <div className="hidden md:flex flex-col w-64 xl:w-[320px] shrink-0 py-6 pl-6 z-10">
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-3xl h-full flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="p-6 overflow-y-auto custom-scrollbar h-full pb-10">
                 <h3 className="text-gray-400 font-bold text-xs mb-5 pl-1 uppercase tracking-widest flex items-center gap-2">
                   <Layers size={14} className="text-blue-400"/> 세부 탐색
                 </h3>
                 <div className="space-y-2">
                   {filterGroups.map((g) => {
                     const Icon = g.icon || Compass;
                     return (
                       <button
                         key={g.id}
                         onClick={() => handleSubGroupSelect(g.id)}
                         className={`w-full shrink-0 flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 ${
                           selectedSubGroup === g.id
                             ? 'bg-blue-600/20 text-white border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] translate-x-1'
                             : 'bg-transparent border border-white/[0.1] hover:bg-white/[0.05] hover:border-white/[0.2] text-gray-300'
                         }`}
                       >
                         <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-xl ${selectedSubGroup === g.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.08] text-gray-400'}`}>
                             <Icon size={16} />
                           </div>
                           <span className={`text-sm font-medium ${selectedSubGroup === g.id ? 'font-bold' : ''}`}>{g.label}</span>
                         </div>
                         <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${selectedSubGroup === g.id ? 'bg-blue-500/20 text-blue-300' : 'bg-white/[0.08] text-gray-400'}`}>
                           {g.spots.length}
                         </span>
                       </button>
                     )
                   })}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Content Area (독립 스크롤 영역) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto modal-scroll-area h-full relative"
        >
          {/* 모바일 전용 Header (스크롤 시 네이티브하게 자연스럽게 올라감) */}
          {headerContent(true)}

          <div className="p-4 md:p-8 xl:p-10 pb-32">
            {/* 2단 분류 탭 영역 */}
            {!isSearching && (
              <div className="-mx-4 px-4 md:mx-0 md:px-0 pb-4 mb-6 md:mb-8 border-b border-white/[0.05] md:border-white/[0.08]">

                {/* 2열 탭: 대륙/테마 (모바일에서도 보이도록 복구, 단 시각적 비중은 낮춤) */}
                <div className="flex overflow-x-auto custom-scrollbar gap-2 w-full pb-2 md:pb-0">
                  {filterMode === 'continent' ? (
                    CONTINENTS.map((cont) => {
                      const Icon = cont.icon;
                      return (
                        <button
                          key={cont.id}
                          onClick={() => handleContinentSelect(cont.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-3 rounded-2xl whitespace-nowrap text-xs md:text-base transition-all border shrink-0 ${
                            selectedContinent === cont.id
                              ? 'bg-white/10 text-white border-white/20 font-bold'
                              : 'bg-white/[0.02] text-gray-300 border-white/[0.15] hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          <Icon size={14} className={selectedContinent === cont.id ? 'text-white' : 'text-gray-400'} />
                          {cont.label}
                        </button>
                      )
                    })
                  ) : (
                    THEMES.map((theme) => {
                      const Icon = theme.icon;
                      const themeColors = CATEGORY_COLORS[theme.id];
                      const isSelected = selectedTheme === theme.id;

                      // 선택된 버튼: 카테고리별 고유 색상 적용
                      const selectedStyle = themeColors
                        ? themeColors
                        : 'bg-white/10 text-white border-white/20';

                      return (
                        <button
                          key={theme.id}
                          onClick={() => handleThemeSelect(theme.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-3 rounded-2xl whitespace-nowrap text-xs md:text-base transition-all border shrink-0 ${
                            isSelected
                              ? `${selectedStyle} font-bold`
                              : 'bg-white/[0.02] text-gray-300 border-white/[0.15] hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          <Icon size={14} className={isSelected && themeColors ? '' : isSelected ? 'text-white' : 'text-gray-400'} />
                          {theme.label}
                        </button>
                      )
                    })
                  )}
                </div>

                {/* 모바일 전용 3열 탭: 세부 카테고리 (가장 눈에 띄는 화려한 메인 버튼 스타일로 부각) */}
                {filterGroups && (
                  <div className="flex md:hidden mt-3 pt-3 border-t border-white/[0.05] overflow-x-auto custom-scrollbar gap-3 w-full pb-2">
                    {filterGroups.map((g) => {
                      const Icon = g.icon || Compass;
                      return (
                        <button
                          key={g.id}
                          onClick={() => handleSubGroupSelect(g.id)}
                          className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap text-sm font-extrabold transition-all shrink-0 ${
                            selectedSubGroup === g.id
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-white/20 scale-105 origin-left'
                              : 'bg-white/[0.05] text-gray-300 border border-white/[0.2] hover:bg-white/[0.1] hover:text-white'
                          }`}
                        >
                          <Icon size={18} className={selectedSubGroup === g.id ? 'text-white drop-shadow-md' : 'text-gray-400'} />
                          {g.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 메인 렌더링 영역 */}
            {renderContent()}

          </div>

          {/* Top 스크롤 버튼 */}
          <button
            onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 w-12 h-12 md:w-14 md:h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] text-white transition-all duration-300 hover:-translate-y-1 z-50 ${showTopBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            aria-label="최상단으로 이동"
          >
            <ArrowUp size={24} />
          </button>
        </div>

      </div>

      {/* 검색 진행 로딩 오버레이 */}
      {isAILoading && (
        <div className="absolute inset-0 z-[300] bg-[#0b101a]/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
           <div className="flex flex-col items-center">
             <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
             <h3 className="text-xl font-bold text-white mb-2">AI가 목적지를 탐색하고 있습니다</h3>
             <p className="text-gray-400 text-sm">유사 지명 및 오타를 검증 중입니다...</p>
           </div>
        </div>
      )}

    </div>
  );
};

export default SearchDiscoveryModal;
