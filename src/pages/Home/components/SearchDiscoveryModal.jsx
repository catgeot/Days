import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, MapPin, Compass, Globe2, Layers, Map, Palmtree, TreePine, Building2, Landmark, Tent } from 'lucide-react';
import { TRAVEL_SPOTS } from '../data/travelSpots';

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

const SearchDiscoveryModal = ({ isOpen, onClose, onSelect, initialQuery = '' }) => {
  // --- 상태 관리 ---
  const [query, setQuery] = useState(initialQuery);
  const [filterMode, setFilterMode] = useState('continent'); // 'continent' | 'theme'
  const [selectedContinent, setSelectedContinent] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const inputRef = useRef(null);

  // 파생 상태
  const isSearching = query.trim().length > 0;
  const isCurationMode = !isSearching && selectedContinent === 'all' && selectedTheme === 'all';
  const isFilterMode = !isSearching && !isCurationMode;

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // 초기화
      setFilterMode('continent');
      setSelectedContinent('all');
      setSelectedTheme('all');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialQuery]);

  // 대륙/테마 탭 전환 핸들러
  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    setSelectedContinent('all');
    setSelectedTheme('all');
  };

  const filteredSpots = useMemo(() => {
    let result = TRAVEL_SPOTS;

    // 검색어 필터링
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
    }
    // 탭 필터링
    else {
      if (filterMode === 'continent' && selectedContinent !== 'all') {
        result = result.filter(spot => spot.continent === selectedContinent);
      } else if (filterMode === 'theme' && selectedTheme !== 'all') {
        result = result.filter(spot => spot.primaryCategory === selectedTheme);
      }
    }

    return [...result].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [query, filterMode, selectedContinent, selectedTheme, isSearching]);

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

          {/* Filter Mode Toggle & Tabs (검색 중이 아닐 때만 표시) */}
          {!isSearching && (
            <div className="mb-8 space-y-4">
              {/* Mode Toggle */}
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

              {/* Sub Tabs */}
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
          <div className="mb-4 text-sm font-medium text-gray-400 flex items-center gap-2">
            <Globe2 size={16} />
            <span>{filteredSpots.length}개의 여행지 발견</span>
          </div>

          {/* Spot Grid */}
          {filteredSpots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSpots.map(spot => {
                const categoryStyle = CATEGORY_COLORS[spot.primaryCategory] || CATEGORY_COLORS.paradise;
                const categoryLabel = CATEGORY_LABELS[spot.primaryCategory] || '기타';
                const CategoryIcon = CATEGORY_ICONS[spot.primaryCategory] || Compass;

                return (
                  <div
                    key={spot.id}
                    onClick={() => {
                      onSelect(spot);
                      onClose();
                    }}
                    className="group relative flex flex-col bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden h-[240px]"
                  >
                    {/* 상단 비주얼 영역 (썸네일/아이콘) */}
                    <div className="h-24 w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-white/5 to-white/0 border-b border-white/5">
                      <div className={`absolute inset-0 opacity-20 ${categoryStyle.split(' ')[0]}`} />
                      <CategoryIcon size={80} className={`absolute -bottom-6 -right-6 opacity-30 transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 ${categoryStyle.split(' ')[1]}`} />

                      <div className="absolute top-3 right-3">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-black/40 backdrop-blur-md border border-white/10 ${categoryStyle.split(' ')[1]}`}>
                          <CategoryIcon size={12} />
                          {categoryLabel}
                        </span>
                      </div>
                    </div>

                    {/* 하단 정보 영역 */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="mb-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 break-keep">
                          {spot.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mt-1">
                          <MapPin size={12} className="text-gray-500" />
                          <span className="truncate">{spot.country} · {spot.name_en}</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed break-keep mt-auto">
                        {spot.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Compass size={48} className="text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-300 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500 break-keep">다른 키워드로 검색하거나 필터를 확인해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDiscoveryModal;
