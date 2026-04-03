import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, MapPin, Compass, Globe2 } from 'lucide-react';
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

const SearchDiscoveryModal = ({ isOpen, onClose, onSelect, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedContinent, setSelectedContinent] = useState('all');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      // 모달이 열릴 때 input에 포커스를 줍니다.
      setTimeout(() => inputRef.current?.focus(), 100);
      // 배경 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialQuery]);

  const filteredSpots = useMemo(() => {
    let result = TRAVEL_SPOTS;

    // 검색어 필터링
    if (query.trim()) {
      const lowerQuery = query.toLowerCase().trim();
      result = result.filter(spot =>
        spot.name.includes(lowerQuery) ||
        spot.name_en.toLowerCase().includes(lowerQuery) ||
        spot.country.includes(lowerQuery) ||
        spot.country_en.toLowerCase().includes(lowerQuery) ||
        (spot.keywords && spot.keywords.some(k => k.includes(lowerQuery)))
      );
    }
    // 대륙 탭 필터링 (검색어가 없을 때만)
    else if (selectedContinent !== 'all') {
      result = result.filter(spot => spot.continent === selectedContinent);
    }

    // 인기순 정렬 (popularity 높은 순)
    return result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [query, selectedContinent]);

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
            placeholder="어디로 떠나고 싶으신가요? (예: 파리, 바다, 유럽)"
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

          {/* Continent Tabs (검색어가 없을 때만 표시) */}
          {!query && (
            <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide flex gap-2">
              {CONTINENTS.map((cont) => (
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
              ))}
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

                return (
                  <div
                    key={spot.id}
                    onClick={() => {
                      onSelect(spot);
                      onClose();
                    }}
                    className="group relative flex flex-col bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
                  >
                    {/* Background Glow Effect */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${categoryStyle.split(' ')[0]}`} />

                    <div className="relative z-10 flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 break-keep">
                          {spot.name}
                        </h3>
                        <p className="text-sm text-gray-400 truncate mt-0.5">
                          {spot.name_en}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md border ${categoryStyle} shrink-0`}>
                        {categoryLabel}
                      </span>
                    </div>

                    <div className="relative z-10 flex items-center gap-1.5 text-xs text-gray-300 font-medium mb-3">
                      <MapPin size={12} className="text-gray-500" />
                      <span>{spot.country}</span>
                    </div>

                    <p className="relative z-10 text-xs text-gray-500 line-clamp-2 leading-relaxed break-keep mt-auto">
                      {spot.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Compass size={48} className="text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-300 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500 break-keep">다른 키워드로 검색하거나 대륙 탭을 확인해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDiscoveryModal;
