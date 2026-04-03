import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, MapPin, Compass, Globe2, Layers, Map, Palmtree, TreePine, Building2, Landmark, Tent, ChevronDown, ChevronRight } from 'lucide-react';
import { TRAVEL_SPOTS } from '../data/travelSpots';
import { usePlaceGallery } from '../../../components/PlaceCard/hooks/usePlaceGallery';

const CONTINENTS = [
  { id: 'all', label: '전체' },
  { id: 'asia', label: '아시아' },
  { id: 'europe', label: '유럽' },
  { id: 'north_america', label: '북미' },
  { id: 'south_america', label: '남미' },
  { id: 'oceania', label: '오세아니아' },
  { id: 'africa', label: '아프리카' },
  { id: 'middle_east', label: '중동' },
  { id: 'unknown', label: '특수 지역' },
];

const THEMES = [
  { id: 'all', label: '전체' },
  { id: 'paradise', label: '휴양' },
  { id: 'nature', label: '자연' },
  { id: 'urban', label: '도심' },
  { id: 'culture', label: '문화' },
  { id: 'adventure', label: '모험' },
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
// 1. 개별 사진 카드 컴포넌트 (횡스크롤 큐레이션용)
// ==============================================================
const SpotThumbnailCard = ({ spot, onClick }) => {
  const { images, isImgLoading } = usePlaceGallery(spot);
  const categoryStyle = CATEGORY_COLORS[spot.primaryCategory] || CATEGORY_COLORS.paradise;
  const categoryLabel = CATEGORY_LABELS[spot.primaryCategory] || '기타';
  const CategoryIcon = CATEGORY_ICONS[spot.primaryCategory] || Compass;

  const bgImgUrl = images && images.length > 0 ? (images[0].urls?.regular || images[0].url) : null;

  return (
    <div
      onClick={() => onClick(spot)}
      className="group relative flex-none w-[220px] md:w-[260px] h-[280px] md:h-[320px] flex flex-col bg-white/5 border border-white/10 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden snap-start hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 hover:border-white/20"
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
        <div className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent ${categoryStyle.split(' ')[0]}`}>
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
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/50 to-transparent opacity-90 transition-opacity" />

      {/* 컨텐츠 (텍스트) */}
      <div className="relative z-10 p-4 h-full flex flex-col">
        {/* 상단 배지 */}
        <div className="self-end mb-auto">
          <span className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg bg-black/60 backdrop-blur-md border border-white/10 ${categoryStyle.split(' ')[1]}`}>
            <CategoryIcon size={12} />
            {categoryLabel}
          </span>
        </div>

        {/* 하단 텍스트 */}
        <div className="mt-auto">
          <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1 break-keep">
            {spot.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-1.5">
            <MapPin size={12} className="text-gray-400" />
            <span className="truncate">{spot.country} · {spot.name_en}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================================
// 2. 아코디언 그룹 컴포넌트 (대륙/테마 필터 결과용)
// ==============================================================
const AccordionGroup = ({ group, onSelectSpot, isExpanded, onToggle }) => {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-bold text-white">{group.label}</h2>
          <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs font-bold text-gray-400">
            {group.spots.length}
          </span>
        </div>
        <ChevronDown className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* 리스트 본문 (애니메이션 적용) */}
      <div
        className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-2 pb-4 pt-1 border-t border-white/5 mx-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          {group.spots.map(spot => {
             const categoryStyle = CATEGORY_COLORS[spot.primaryCategory] || CATEGORY_COLORS.paradise;
             const CategoryIcon = CATEGORY_ICONS[spot.primaryCategory] || Compass;

             return (
              <div
                key={spot.id}
                onClick={() => onSelectSpot(spot)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/10 ${categoryStyle.split(' ')[0]} ${categoryStyle.split(' ')[1]}`}>
                  <CategoryIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{spot.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{spot.country} · {spot.name_en}</p>
                </div>
                <ChevronRight size={16} className="text-gray-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </div>
             );
          })}
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

  // 아코디언 상태 관리 (한 번에 하나만 열거나 여러 개 열 수 있게. 여기선 여러 개 허용)
  const [expandedGroups, setExpandedGroups] = useState({});

  const inputRef = useRef(null);

  const isSearching = query.trim().length > 0;
  const isCurationMode = !isSearching && selectedContinent === 'all' && selectedTheme === 'all';

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      // 모달 열릴 때 아코디언 상태 초기화
      setExpandedGroups({});
    } else {
      document.body.style.overflow = '';
      setFilterMode('continent');
      setSelectedContinent('all');
      setSelectedTheme('all');
      setExpandedGroups({});
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialQuery]);

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    setSelectedContinent('all');
    setSelectedTheme('all');
    setExpandedGroups({});
  };

  const handleSpotSelect = (spot) => {
    onSelect(spot);
    onClose();
  };

  const toggleAccordion = (label) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
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
    } else {
      if (filterMode === 'continent' && selectedContinent !== 'all') {
        result = result.filter(spot => spot.continent === selectedContinent);
      } else if (filterMode === 'theme' && selectedTheme !== 'all') {
        result = result.filter(spot => spot.primaryCategory === selectedTheme);
      }
    }
    return [...result].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [query, filterMode, selectedContinent, selectedTheme, isSearching]);

  const curationData = useMemo(() => {
    if (!isCurationMode) return null;
    return {
      trending: filteredSpots.slice(0, 6), // 횡스크롤이므로 6개 정도로 넉넉하게
      healing: filteredSpots.filter(s => s.primaryCategory === 'paradise' || s.primaryCategory === 'nature').slice(0, 6),
      city: filteredSpots.filter(s => s.primaryCategory === 'urban' || s.primaryCategory === 'culture').slice(0, 6)
    };
  }, [isCurationMode, filteredSpots]);

  const filterGroups = useMemo(() => {
    if (isSearching || isCurationMode) return null;

    if (filterMode === 'continent' && selectedContinent !== 'all') {
      return THEMES.filter(t => t.id !== 'all').map(t => ({
        label: t.label,
        spots: filteredSpots.filter(s => s.primaryCategory === t.id)
      })).filter(g => g.spots.length > 0);
    }
    if (filterMode === 'theme' && selectedTheme !== 'all') {
      return CONTINENTS.filter(c => c.id !== 'all').map(c => ({
        label: c.label,
        spots: filteredSpots.filter(s => s.continent === c.id)
      })).filter(g => g.spots.length > 0);
    }
    return null;
  }, [isSearching, isCurationMode, filterMode, selectedContinent, selectedTheme, filteredSpots]);

  // 필터 그룹 변경 시 자동으로 첫 번째 아코디언 열기
  useEffect(() => {
    if (filterGroups && filterGroups.length > 0 && Object.keys(expandedGroups).length === 0) {
      setExpandedGroups({ [filterGroups[0].label]: true });
    }
  }, [filterGroups]);


  const renderCurationSection = (title, subtitle, icon, spots, delayClass) => {
    if (!spots || spots.length === 0) return null;

    return (
      <div className={`animate-fade-in-up ${delayClass}`}>
        <div className="flex items-center gap-3 mb-4 px-1">
          {icon}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
            <p className="text-gray-400 text-xs md:text-sm mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* 횡스크롤 컨테이너 */}
        <div className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {spots.map(spot => (
            <SpotThumbnailCard key={spot.id} spot={spot} onClick={handleSpotSelect} />
          ))}

          {/* 전체보기 모어 타일 */}
          <div
            onClick={() => handleFilterModeChange('continent')} // 대륙별 전체 리스트로 유도
            className="group relative flex-none w-[120px] md:w-[150px] h-[280px] md:h-[320px] flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 snap-start transition-colors"
          >
            <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-blue-400 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                <ChevronRight size={24} />
              </div>
              <span className="text-sm font-bold">더 찾아보기</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (filteredSpots.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <Compass size={48} className="text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">검색 결과가 없습니다</h3>
          <p className="text-gray-500 break-keep">다른 키워드로 검색하거나 필터를 확인해보세요.</p>
        </div>
      );
    }

    if (isCurationMode && curationData) {
      return (
        <div className="space-y-12 pb-10">
          {renderCurationSection(
            "지금 가장 핫한 여행지",
            "요즘 여행자들이 가장 많이 찾는 곳",
            <div className="p-2 bg-red-500/20 rounded-xl"><Compass className="text-red-400" size={24} /></div>,
            curationData.trending,
            ""
          )}
          {renderCurationSection(
            "일상의 탈출, 완벽한 휴양",
            "아무것도 하지 않을 자유가 있는 곳",
            <div className="p-2 bg-cyan-500/20 rounded-xl"><Palmtree className="text-cyan-400" size={24} /></div>,
            curationData.healing,
            "animation-delay-100"
          )}
          {renderCurationSection(
            "영감을 주는 도시 탐험",
            "예술과 문화, 트렌드가 숨쉬는 매력적인 도심",
            <div className="p-2 bg-purple-500/20 rounded-xl"><Building2 className="text-purple-400" size={24} /></div>,
            curationData.city,
            "animation-delay-200"
          )}
        </div>
      );
    }

    // 교차 필터 그룹화 뷰 (아코디언 구조)
    if (!isSearching && filterGroups) {
      return (
        <div className="space-y-3 pb-20">
          {filterGroups.map((g, idx) => (
            <div key={g.label} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <AccordionGroup
                group={g}
                isExpanded={!!expandedGroups[g.label]}
                onToggle={() => toggleAccordion(g.label)}
                onSelectSpot={handleSpotSelect}
              />
            </div>
          ))}
        </div>
      );
    }

    // 기본 리스트 뷰 (검색 결과) - 여기도 아코디언 리스트 스타일과 일관성 유지
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-20">
        {filteredSpots.map(spot => {
          const categoryStyle = CATEGORY_COLORS[spot.primaryCategory] || CATEGORY_COLORS.paradise;
          const CategoryIcon = CATEGORY_ICONS[spot.primaryCategory] || Compass;
          return (
            <div
              key={spot.id}
              onClick={() => handleSpotSelect(spot)}
              className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${categoryStyle.split(' ')[0]} ${categoryStyle.split(' ')[1]}`}>
                <CategoryIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-white truncate group-hover:text-blue-400 transition-colors">{spot.name}</h4>
                <p className="text-sm text-gray-500 truncate mt-0.5">{spot.country} · {spot.name_en}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#05070a]/95 backdrop-blur-2xl animate-fade-in">
      {/* Header / Search Bar */}
      <div className="flex items-center gap-3 p-4 md:p-6 border-b border-white/10 shrink-0">
        <div className="flex-1 relative flex items-center bg-white/5 border border-white/10 rounded-2xl h-14 overflow-hidden focus-within:border-blue-500/50 focus-within:bg-white/10 transition-colors">
          <Search size={20} className="text-gray-400 ml-4 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="어디로 떠나고 싶으신가요? (예: 파리, 바다, 휴양)"
            className="w-full bg-transparent text-white px-4 h-full outline-none placeholder-gray-500 text-lg md:text-xl font-medium"
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
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
        >
          <span className="sr-only">닫기</span>
          <X size={24} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24">

          {/* Filter Mode Toggle & Tabs */}
          {!isSearching && (
            <div className="mb-8 space-y-4">
              <div className="flex bg-white/5 p-1 rounded-xl w-fit border border-white/10">
                <button
                  onClick={() => handleFilterModeChange('continent')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    filterMode === 'continent'
                      ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Map size={16} /> 대륙별 탐색
                </button>
                <button
                  onClick={() => handleFilterModeChange('theme')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    filterMode === 'theme'
                      ? 'bg-purple-600/20 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.2)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Layers size={16} /> 테마별 탐색
                </button>
              </div>

              <div className="overflow-x-auto pb-2 scrollbar-hide flex gap-2">
                {filterMode === 'continent' ? (
                  CONTINENTS.map((cont) => (
                    <button
                      key={cont.id}
                      onClick={() => setSelectedContinent(cont.id)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border ${
                        selectedContinent === cont.id
                          ? 'bg-blue-600/20 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {cont.label}
                    </button>
                  ))
                ) : (
                  THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border ${
                        selectedTheme === theme.id
                          ? 'bg-purple-600/20 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.2)]'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Result Stats */}
          {(!isCurationMode || isSearching) && (
            <div className="mb-6 text-sm font-medium text-gray-400 flex items-center gap-2">
              <Globe2 size={16} />
              <span>{filteredSpots.length}개의 여행지 발견</span>
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
