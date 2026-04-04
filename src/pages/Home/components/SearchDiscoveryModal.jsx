import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Compass, Globe2, Layers, Map, ArrowUp } from 'lucide-react';
import { TRAVEL_SPOTS } from '../data/travelSpots';

// 분리된 컴포넌트 및 유틸리티 import
import { CONTINENTS, THEMES, CATEGORY_LABELS } from './SearchDiscovery/constants';
import { getDailySeed, shuffleWithSeed } from './SearchDiscovery/utils';
import SpotThumbnailCard from './SearchDiscovery/SpotThumbnailCard';
import CurationSection from './SearchDiscovery/CurationSection';

const SearchDiscoveryModal = ({ isOpen, onClose, onSelect, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [filterMode, setFilterMode] = useState('continent');
  const [selectedContinent, setSelectedContinent] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const isSearching = query.trim().length > 0;
  const isCurationMode = !isSearching && selectedContinent === 'all' && selectedTheme === 'all';

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      // 모바일 키보드 자동 올림 방지를 위해 focus() 제거
      document.body.style.overflow = 'hidden';
      setSelectedSubGroup(null);
    } else {
      document.body.style.overflow = '';
      setFilterMode('continent');
      setSelectedContinent('all');
      setSelectedTheme('all');
      setSelectedSubGroup(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialQuery]);

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    setSelectedContinent('all');
    setSelectedTheme('all');
    setSelectedSubGroup(null);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSpotSelect = (spot) => {
    onSelect(spot);
    onClose();
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
    return {
      trending: shuffled.slice(0, 10),
      healing: shuffled.filter(s => s.primaryCategory === 'paradise' || s.primaryCategory === 'nature').slice(0, 10),
      city: shuffled.filter(s => s.primaryCategory === 'urban' || s.primaryCategory === 'culture').slice(0, 10)
    };
  }, [isCurationMode, filteredSpots]);

  // 사이드바용 메뉴 그룹화
  const filterGroups = useMemo(() => {
    if (isSearching || isCurationMode) return null;

    if (filterMode === 'continent' && selectedContinent !== 'all') {
      return THEMES.filter(t => t.id !== 'all').map(t => ({
        label: t.label,
        icon: t.icon,
        spots: filteredSpots.filter(s => s.primaryCategory === t.id)
      })).filter(g => g.spots.length > 0);
    }
    if (filterMode === 'theme' && selectedTheme !== 'all') {
      return CONTINENTS.filter(c => c.id !== 'all').map(c => ({
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
      if (!selectedSubGroup || !filterGroups.find(g => g.label === selectedSubGroup)) {
        setSelectedSubGroup(filterGroups[0].label);
      }
    } else {
      setSelectedSubGroup(null);
    }
  }, [filterGroups, selectedSubGroup]);

  const handleScroll = (e) => {
    if (e.target.scrollTop > 300) {
      setShowTopBtn(true);
    } else {
      setShowTopBtn(false);
    }
  };

  const renderContent = () => {
    if (filteredSpots.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 w-full">
          <Compass size={48} className="text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">검색 결과가 없습니다</h3>
          <p className="text-gray-500 break-keep">다른 키워드로 검색하거나 필터를 확인해보세요.</p>
        </div>
      );
    }

    // 1. 큐레이션 모드 (검색어 없음, 전체 선택)
    if (isCurationMode && curationData) {
      return (
        <div className="space-y-12 pb-10 w-full pt-4">
          <CurationSection
            title="지금 가장 핫한 여행지"
            subtitle="요즘 여행자들이 가장 많이 찾는 곳"
            icon={<div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20"><Compass className="text-red-400" size={24} /></div>}
            spots={curationData.trending}
            delayClass=""
            onSelectSpot={handleSpotSelect}
            onMoreClick={() => handleFilterModeChange('continent')}
          />
          <CurationSection
            title="일상의 탈출, 완벽한 휴양"
            subtitle="아무것도 하지 않을 자유가 있는 곳"
            icon={<div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20"><Layers className="text-cyan-400" size={24} /></div>}
            spots={curationData.healing}
            delayClass="animation-delay-100"
            onSelectSpot={handleSpotSelect}
            onMoreClick={() => { handleFilterModeChange('theme'); setSelectedTheme('paradise'); }}
          />
          <CurationSection
            title="영감을 주는 도시 탐험"
            subtitle="예술과 문화, 트렌드가 숨쉬는 매력적인 도심"
            icon={<div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20"><Map className="text-purple-400" size={24} /></div>}
            spots={curationData.city}
            delayClass="animation-delay-200"
            onSelectSpot={handleSpotSelect}
            onMoreClick={() => { handleFilterModeChange('theme'); setSelectedTheme('urban'); }}
          />
        </div>
      );
    }

    // 2. 교차 필터 뷰
    if (!isSearching && filterGroups) {
      const displaySpots = filterGroups.find(g => g.label === selectedSubGroup)?.spots || [];

      return (
        <div className="w-full animate-fade-in-up pb-20">
          <div className="block">
            {/* Result Stats */}
            <div className="mb-6 text-sm font-medium text-gray-500 flex items-center gap-2">
              <Globe2 size={16} />
              <span>{displaySpots.length}개의 여행지</span>
              <span className="text-gray-700">|</span>
              <span className="text-blue-400 font-bold">{selectedSubGroup}</span>
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
    <div className={`flex flex-col md:flex-row md:items-center gap-4 px-4 md:px-6 py-4 md:py-4 border-b border-white/[0.08] shrink-0 bg-[#0b101a]/80 backdrop-blur-md z-20 ${isMobileView ? 'md:hidden' : 'hidden md:flex'}`}>
      {/* 상단 닫기(홈으로) 및 모바일용 필터 토글 */}
      <div className="flex items-center justify-between md:justify-start gap-4">
        <button onClick={onClose} className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors group shrink-0">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.08] group-hover:bg-white/[0.1] transition-all group-hover:scale-105 shadow-lg">
            <X size={24} />
          </div>
          <span className="font-bold hidden md:block text-lg">홈으로</span>
        </button>

        {/* 모바일 전용: 필터 토글 탭 */}
        {isMobileView && !isSearching && (
          <div className="md:hidden flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => handleFilterModeChange('continent')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'continent' ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'text-gray-500'
              }`}
            >
              <Map size={14} /> 대륙
            </button>
            <button
              onClick={() => handleFilterModeChange('theme')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'theme' ? 'bg-purple-600/20 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.15)]' : 'text-gray-500'
              }`}
            >
              <Layers size={14} /> 테마
            </button>
          </div>
        )}
      </div>

      {/* PC 전용: 필터 토글 탭 */}
      {!isMobileView && !isSearching && (
        <div className="hidden md:flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.08] ml-2 shrink-0">
          <button
            onClick={() => handleFilterModeChange('continent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filterMode === 'continent' ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Map size={16} /> 대륙별 탐색
          </button>
          <button
            onClick={() => handleFilterModeChange('theme')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filterMode === 'theme' ? 'bg-purple-600/20 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.15)]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Layers size={16} /> 테마별 탐색
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex-1 max-w-3xl relative flex items-center bg-white/[0.08] border border-white/[0.15] rounded-2xl h-12 md:h-14 overflow-hidden focus-within:border-blue-500/40 focus-within:bg-white/[0.1] focus-within:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all md:ml-auto">
        <Search size={20} className="text-gray-400 ml-4 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="어디로 떠나고 싶으신가요?"
          className="w-full bg-transparent text-white px-4 h-full outline-none placeholder-gray-600 text-base md:text-xl font-medium"
        />
        {query && (
          <button
             onClick={() => { setQuery(''); inputRef.current?.focus(); }}
             className="p-3 text-gray-400 hover:text-white transition-colors"
          >
             <X size={20} />
          </button>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0b101a]/95 backdrop-blur-3xl animate-fade-in overflow-hidden">
      {/* 글로벌 스크롤바 상시 노출을 위한 인라인 스타일 */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar { display: block; height: 6px; width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.25); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.5); }
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
                         key={g.label}
                         onClick={() => setSelectedSubGroup(g.label)}
                         className={`w-full shrink-0 flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 ${
                           selectedSubGroup === g.label
                             ? 'bg-blue-600/20 text-white border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] translate-x-1'
                             : 'bg-transparent border border-transparent hover:bg-white/[0.05] hover:border-white/[0.05] text-gray-400'
                         }`}
                       >
                         <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-xl ${selectedSubGroup === g.label ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'}`}>
                             <Icon size={16} />
                           </div>
                           <span className={`text-sm font-medium ${selectedSubGroup === g.label ? 'font-bold' : ''}`}>{g.label}</span>
                         </div>
                         <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${selectedSubGroup === g.label ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-gray-500'}`}>
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
            {/* 헤더 Sticky 영역: 모바일/PC 분리하여 직관성 극대화 */}
            {!isSearching && (
              <div className="sticky top-0 z-30 bg-[#0b101a]/90 backdrop-blur-xl -mx-4 px-4 md:mx-0 md:px-0 pt-4 pb-4 mb-6 md:mb-8 border-b md:border-none border-white/[0.05] md:bg-transparent md:backdrop-blur-none">

                {/* 2열 탭: 대륙/테마 (모바일에서도 보이도록 복구, 단 시각적 비중은 낮춤) */}
                <div className="flex overflow-x-auto custom-scrollbar gap-2 w-full pb-2 md:pb-0">
                  {filterMode === 'continent' ? (
                    CONTINENTS.map((cont) => {
                      const Icon = cont.icon;
                      return (
                        <button
                          key={cont.id}
                          onClick={() => setSelectedContinent(cont.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-3 rounded-2xl whitespace-nowrap text-xs md:text-base transition-all border shrink-0 ${
                            selectedContinent === cont.id
                              ? 'bg-white/10 text-white border-white/20 font-bold'
                              : 'bg-white/[0.02] text-gray-500 border-white/[0.05] hover:bg-white/[0.05] hover:text-gray-300'
                          }`}
                        >
                          <Icon size={14} className={selectedContinent === cont.id ? 'text-white' : 'text-gray-600'} />
                          {cont.label}
                        </button>
                      )
                    })
                  ) : (
                    THEMES.map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedTheme(theme.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-3 rounded-2xl whitespace-nowrap text-xs md:text-base transition-all border shrink-0 ${
                            selectedTheme === theme.id
                              ? 'bg-white/10 text-white border-white/20 font-bold'
                              : 'bg-white/[0.02] text-gray-500 border-white/[0.05] hover:bg-white/[0.05] hover:text-gray-300'
                          }`}
                        >
                          <Icon size={14} className={selectedTheme === theme.id ? 'text-white' : 'text-gray-600'} />
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
                          key={g.label}
                          onClick={() => setSelectedSubGroup(g.label)}
                          className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap text-sm font-extrabold transition-all shrink-0 ${
                            selectedSubGroup === g.label
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-white/20 scale-105 origin-left'
                              : 'bg-white/[0.05] text-gray-400 border border-white/[0.1] hover:bg-white/[0.1]'
                          }`}
                        >
                          <Icon size={18} className={selectedSubGroup === g.label ? 'text-white drop-shadow-md' : 'text-gray-500'} />
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
    </div>
  );
};

export default SearchDiscoveryModal;
