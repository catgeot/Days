import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, MapPin, Compass, Globe2, Layers, Map, Palmtree, TreePine, Building2, Landmark, Tent, ChevronDown, ChevronRight, ChevronLeft, ArrowUp } from 'lucide-react';
import { TRAVEL_SPOTS } from '../data/travelSpots';
import { usePlaceGallery } from '../../../components/PlaceCard/hooks/usePlaceGallery';

const CONTINENTS = [
  { id: 'all', label: '전체', icon: Globe2 },
  { id: 'asia', label: '아시아', icon: Map },
  { id: 'europe', label: '유럽', icon: Map },
  { id: 'north_america', label: '북미', icon: Map },
  { id: 'south_america', label: '남미', icon: Map },
  { id: 'oceania', label: '오세아니아', icon: Map },
  { id: 'africa', label: '아프리카', icon: Map },
  { id: 'middle_east', label: '중동', icon: Map },
  { id: 'unknown', label: '특수 지역', icon: Map },
];

const THEMES = [
  { id: 'all', label: '전체', icon: Layers },
  { id: 'paradise', label: '휴양', icon: Palmtree },
  { id: 'nature', label: '자연', icon: TreePine },
  { id: 'urban', label: '도심', icon: Building2 },
  { id: 'culture', label: '문화', icon: Landmark },
  { id: 'adventure', label: '모험', icon: Tent },
];

const CATEGORY_COLORS = {
  paradise: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  nature: 'bg-green-500/20 text-green-400 border-green-500/30',
  urban: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  culture: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  adventure: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const CATEGORY_LABELS = {
  paradise: '휴양',
  nature: '자연',
  urban: '도심',
  culture: '문화',
  adventure: '모험',
};

const CATEGORY_ICONS = {
  paradise: Palmtree,
  nature: TreePine,
  urban: Building2,
  culture: Landmark,
  adventure: Tent,
};

// ==============================================================
// 유틸리티: 일일 무작위 셔플 (매일 달라지는 큐레이션)
// ==============================================================
const getDailySeed = () => {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
};

const shuffleWithSeed = (array, seed) => {
  let currentIndex = array.length, temporaryValue, randomIndex;
  let currentSeed = seed;
  const random = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };
  const result = [...array];
  while (0 !== currentIndex) {
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = result[currentIndex];
    result[currentIndex] = result[randomIndex];
    result[randomIndex] = temporaryValue;
  }
  return result;
};

// ==============================================================
// 1. 공통 사진 배경 카드 (횡스크롤 & 사이드바 그리드 범용)
// ==============================================================
const SpotThumbnailCard = ({ spot, onClick, isGrid = false }) => {
  const { images, isImgLoading } = usePlaceGallery(spot);
  const categoryStyle = CATEGORY_COLORS[spot.primaryCategory] || CATEGORY_COLORS.paradise;
  const categoryLabel = CATEGORY_LABELS[spot.primaryCategory] || '기타';
  const CategoryIcon = CATEGORY_ICONS[spot.primaryCategory] || Compass;

  const bgImgUrl = images && images.length > 0 ? (images[0].urls?.regular || images[0].url) : null;

  // 횡스크롤용 고정 크기 vs 그리드용 반응형 비율 크기
  const baseSize = isGrid
    ? "w-full aspect-[3/4] md:aspect-[4/5]"
    : "w-[220px] md:w-[260px] h-[280px] md:h-[320px] flex-none snap-start";

  return (
    <div
      onClick={() => onClick(spot)}
      className={`group relative flex flex-col bg-white/[0.03] border border-white/[0.08] rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-white/20 ${baseSize}`}
    >
      {/* 배경 사진 영역 */}
      {bgImgUrl ? (
        <img
          src={bgImgUrl}
          alt={spot.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent ${categoryStyle.split(' ')[0]}`}>
           {isImgLoading ? (
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
             </div>
           ) : (
             <CategoryIcon size={100} className="absolute -bottom-4 -right-4 opacity-20" />
           )}
        </div>
      )}

      {/* 그라디언트 오버레이 (가독성 향상) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b101a] via-[#0b101a]/50 to-transparent opacity-90 transition-opacity" />

      {/* 컨텐츠 (텍스트) */}
      <div className="relative z-10 p-4 h-full flex flex-col">
        {/* 상단 배지 */}
        <div className="self-end mb-auto">
          <span className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg bg-black/40 backdrop-blur-md border border-white/10 ${categoryStyle.split(' ')[1]}`}>
            <CategoryIcon size={12} />
            {categoryLabel}
          </span>
        </div>

        {/* 하단 텍스트 */}
        <div className="mt-auto">
          <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1 break-keep drop-shadow-md">
            {spot.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-1.5 drop-shadow-md">
            <MapPin size={12} className="text-gray-400" />
            <span className="truncate">{spot.country} · {spot.name_en}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================================
// 1-2. 횡스크롤 큐레이션 섹션 (좌우 스크롤 버튼 포함)
// ==============================================================
const CurationSection = ({ title, subtitle, icon, spots, delayClass, onSelectSpot, onMoreClick }) => {
  const scrollRef = useRef(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftBtn(scrollLeft > 10);
    setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = window.innerWidth > 768 ? 600 : 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [spots]);

  if (!spots || spots.length === 0) return null;

  return (
    <div className={`animate-fade-in-up ${delayClass} relative group`}>
      <div className="flex items-center gap-3 mb-4 px-1">
        {icon}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
          <p className="text-gray-400 text-xs md:text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="relative">
        {/* 왼쪽 스크롤 버튼 (모바일에서도 상시 노출되도록 flex로 변경) */}
        <button
          onClick={() => scroll('left')}
          className={`flex absolute left-0 md:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20 items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-2xl ${!showLeftBtn && 'opacity-0 pointer-events-none'}`}
        >
          <ChevronLeft size={20} className="mr-0.5" />
        </button>

        {/* 횡스크롤 컨테이너 - 커스텀 스크롤바 디자인 적용 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
        >
          {spots.map(spot => (
            <SpotThumbnailCard key={spot.id} spot={spot} onClick={onSelectSpot} />
          ))}

          {/* 전체보기 모어 타일 */}
          <div
            onClick={onMoreClick}
            className="group/more relative flex-none w-[120px] md:w-[150px] h-[280px] md:h-[320px] flex items-center justify-center bg-white/[0.03] border border-white/[0.08] rounded-2xl cursor-pointer hover:bg-white/[0.06] snap-start transition-colors"
          >
            <div className="flex flex-col items-center gap-3 text-gray-500 group-hover/more:text-blue-400 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/5 group-hover/more:bg-blue-500/20 flex items-center justify-center transition-colors">
                <ChevronRight size={24} />
              </div>
              <span className="text-sm font-bold">더 찾아보기</span>
            </div>
          </div>
        </div>

        {/* 오른쪽 스크롤 버튼 (모바일에서도 상시 노출) */}
        <button
          onClick={() => scroll('right')}
          className={`flex absolute right-0 md:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20 items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-2xl ${!showRightBtn && 'opacity-0 pointer-events-none'}`}
        >
          <ChevronRight size={20} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
};


// ==============================================================
// 2. 모바일 전용 아코디언 그룹 컴포넌트 (대륙/테마 필터 결과용)
// ==============================================================
const AccordionGroup = ({ group, onSelectSpot, isExpanded, onToggle }) => {
  const Icon = group.icon || Compass;
  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] overflow-hidden transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.06] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={isExpanded ? 'text-blue-400' : 'text-gray-400'} />
          <h2 className="text-lg font-bold text-white">{group.label}</h2>
          <span className="px-2.5 py-1 bg-black/40 rounded-full text-xs font-bold text-gray-400 border border-white/10">
            {group.spots.length}
          </span>
        </div>
        <ChevronDown className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-400' : ''}`} />
      </button>

      {/* 모바일 2열 사진 카드 그리드 */}
      <div
        className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-3 pb-5 pt-1 border-t border-white/5">
          <div className="grid grid-cols-2 gap-3 mt-3">
            {group.spots.map(spot => (
              <SpotThumbnailCard key={spot.id} spot={spot} onClick={onSelectSpot} isGrid={true} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================================
// 메인 모달 컴포넌트
// ==============================================================
const SearchDiscoveryModal = ({ isOpen, onClose, onSelect, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [filterMode, setFilterMode] = useState('continent');
  const [selectedContinent, setSelectedContinent] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedSubGroup, setSelectedSubGroup] = useState('all');

  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const isSearching = query.trim().length > 0;
  const isCurationMode = !isSearching && selectedContinent === 'all' && selectedTheme === 'all';

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      setSelectedSubGroup('all');
    } else {
      document.body.style.overflow = '';
      setFilterMode('continent');
      setSelectedContinent('all');
      setSelectedTheme('all');
      setSelectedSubGroup('all');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialQuery]);

  // 상위 필터 변경 시 서브 그룹 초기화
  useEffect(() => {
    setSelectedSubGroup('all');
  }, [filterMode, selectedContinent, selectedTheme, isSearching]);

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    setSelectedContinent('all');
    setSelectedTheme('all');
    setSelectedSubGroup('all');
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0 });
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

  // 사이드바용 메뉴 그룹화 (기존 아코디언 대신)
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

  const renderContent = () => {
    if (filteredSpots.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <Compass size={48} className="text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">검색 결과가 없습니다</h3>
          <p className="text-gray-500 break-keep">다른 키워드로 검색하거나 필터를 확인해보세요.</p>
        </div>
      );
    }

    // 1. 큐레이션 모드 (검색어 없음, 전체 선택)
    if (isCurationMode && curationData) {
      return (
        <div className="space-y-12 pb-10">
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
            icon={<div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20"><Palmtree className="text-cyan-400" size={24} /></div>}
            spots={curationData.healing}
            delayClass="animation-delay-100"
            onSelectSpot={handleSpotSelect}
            onMoreClick={() => { handleFilterModeChange('theme'); setSelectedTheme('paradise'); }}
          />
          <CurationSection
            title="영감을 주는 도시 탐험"
            subtitle="예술과 문화, 트렌드가 숨쉬는 매력적인 도심"
            icon={<div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20"><Building2 className="text-purple-400" size={24} /></div>}
            spots={curationData.city}
            delayClass="animation-delay-200"
            onSelectSpot={handleSpotSelect}
            onMoreClick={() => { handleFilterModeChange('theme'); setSelectedTheme('urban'); }}
          />
        </div>
      );
    }

    // 2. 교차 필터 뷰 (모바일: 아코디언, PC: 사이드바 + 콘텐츠)
    if (!isSearching && filterGroups) {
      const displaySpots = selectedSubGroup === 'all'
        ? filteredSpots
        : filterGroups.find(g => g.label === selectedSubGroup)?.spots || [];

      return (
        <div className="w-full animate-fade-in-up pb-20">

          {/* [모바일 전용] 아코디언 리스트 구조 (선택 시 카드 펼쳐짐) */}
          <div className="md:hidden space-y-3">
            {filterGroups.map((g) => (
              <AccordionGroup
                key={g.label}
                group={g}
                isExpanded={selectedSubGroup === g.label}
                onToggle={() => setSelectedSubGroup(selectedSubGroup === g.label ? 'all' : g.label)}
                onSelectSpot={handleSpotSelect}
              />
            ))}
          </div>

          {/* [PC 전용] 사이드바 + 그리드 콘텐츠 구조 */}
          <div className="hidden md:flex flex-row gap-5 md:gap-6">
            {/* 좌측 사이드바 메뉴 */}
            <div className="w-56 lg:w-64 shrink-0 flex flex-col gap-2 custom-scrollbar pb-0">
              <button
                onClick={() => setSelectedSubGroup('all')}
                className={`shrink-0 flex items-center justify-between p-3.5 rounded-xl transition-all border ${
                  selectedSubGroup === 'all'
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30 font-bold shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe2 size={18} className={selectedSubGroup === 'all' ? 'text-blue-400' : 'text-gray-500'} />
                  <span className="text-sm">전체 보기</span>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${selectedSubGroup === 'all' ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                  {filteredSpots.length}
                </span>
              </button>

              {filterGroups.map((g) => {
                const Icon = g.icon || Compass;
                return (
                  <button
                    key={g.label}
                    onClick={() => setSelectedSubGroup(g.label)}
                    className={`shrink-0 flex items-center justify-between p-3.5 rounded-xl transition-all border ${
                      selectedSubGroup === g.label
                        ? 'bg-white/10 text-white border-white/20 font-bold shadow-lg'
                        : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] text-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={18} className={selectedSubGroup === g.label ? 'text-white' : 'text-gray-500'} />
                      <span className="text-sm">{g.label}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${selectedSubGroup === g.label ? 'bg-white/20 border-white/30 text-white' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                      {g.spots.length}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 우측 콘텐츠 (사진 카드 그리드) */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {displaySpots.map(spot => (
                  <SpotThumbnailCard key={spot.id} spot={spot} onClick={handleSpotSelect} isGrid={true} />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3. 검색 결과 (그리드 뷰)
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-20">
        {filteredSpots.map(spot => (
          <SpotThumbnailCard key={spot.id} spot={spot} onClick={handleSpotSelect} isGrid={true} />
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0b101a]/95 backdrop-blur-3xl animate-fade-in">
      {/* 글로벌 스크롤바 상시 노출을 위한 인라인 스타일 (모달 전용) */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { display: block; height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.3); }

        .modal-scroll-area::-webkit-scrollbar { display: block; width: 8px; }
        .modal-scroll-area::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .modal-scroll-area::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.15); border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
        .modal-scroll-area::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.3); }
      `}} />

      {/* Header / Search Bar */}
      <div className="flex items-center gap-3 p-4 md:p-6 border-b border-white/[0.08] shrink-0 bg-[#0b101a]/50">
        <div className="flex-1 relative flex items-center bg-white/[0.05] border border-white/[0.1] rounded-2xl h-14 overflow-hidden focus-within:border-blue-500/40 focus-within:bg-white/[0.08] focus-within:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all">
          <Search size={20} className="text-gray-400 ml-4 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="어디로 떠나고 싶으신가요?"
            className="w-full bg-transparent text-white px-4 h-full outline-none placeholder-gray-600 text-lg md:text-xl font-medium"
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
        <button
          onClick={onClose}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all shrink-0"
        >
          <span className="sr-only">닫기</span>
          <X size={24} />
        </button>
      </div>

      {/* Content Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain modal-scroll-area"
      >
        <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24 relative">

          {/* Filter Mode Toggle & Tabs (모바일 탭 디자인 강화) */}
          {!isSearching && (
            <div className="mb-8 space-y-4">
              <div className="flex bg-white/[0.03] p-1 rounded-xl w-fit border border-white/[0.08]">
                <button
                  onClick={() => handleFilterModeChange('continent')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    filterMode === 'continent'
                      ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Map size={16} /> 대륙별 탐색
                </button>
                <button
                  onClick={() => handleFilterModeChange('theme')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    filterMode === 'theme'
                      ? 'bg-purple-600/20 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Layers size={16} /> 테마별 탐색
                </button>
              </div>

              {/* 가로 스크롤 상시 노출 적용: custom-scrollbar */}
              <div className="overflow-x-auto pb-3 custom-scrollbar flex gap-2">
                {filterMode === 'continent' ? (
                  CONTINENTS.map((cont) => {
                    const Icon = cont.icon;
                    return (
                      <button
                        key={cont.id}
                        onClick={() => setSelectedContinent(cont.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border ${
                          selectedContinent === cont.id
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                            : 'bg-white/[0.03] text-gray-400 border-white/[0.08] hover:bg-white/[0.08]'
                        }`}
                      >
                        {cont.id !== 'all' && <Icon size={14} className={selectedContinent === cont.id ? 'text-blue-400' : 'text-gray-500'} />}
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
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border ${
                          selectedTheme === theme.id
                            ? 'bg-purple-600/20 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                            : 'bg-white/[0.03] text-gray-400 border-white/[0.08] hover:bg-white/[0.08]'
                        }`}
                      >
                        {theme.id !== 'all' && <Icon size={14} className={selectedTheme === theme.id ? 'text-purple-400' : 'text-gray-500'} />}
                        {theme.label}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Result Stats */}
          {(!isCurationMode || isSearching) && (
            <div className="mb-6 text-sm font-medium text-gray-500 flex items-center gap-2">
              <Globe2 size={16} />
              <span>총 {filteredSpots.length}개의 여행지</span>
              {!isSearching && filterGroups && selectedSubGroup !== 'all' && (
                 <>
                   <span className="text-gray-700">|</span>
                   <span className="text-blue-400 font-bold">{selectedSubGroup}</span>
                 </>
              )}
            </div>
          )}

          {/* Spot Grid & Groups */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SearchDiscoveryModal;
