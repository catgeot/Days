import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Compass, ChevronRight, Hash } from 'lucide-react';

const PublicNav = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentLoc = searchParams.get('location');

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('location')
        .eq('is_public', true)
        .eq('is_deleted', false)
        .neq('location', null)
        .neq('location', '');

      if (!error && data) {
        // 중복 제거 후 빈도 계산
        const locCounts = {};
        data.forEach(r => {
          const loc = r.location.trim();
          if (loc) locCounts[loc] = (locCounts[loc] || 0) + 1;
        });

        // 정렬 (빈도수 내림차순, 그 다음 이름순)
        const sorted = Object.entries(locCounts)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 15) // 상위 15개 지역만
          .map(([name, count]) => ({ name, count }));

        setLocations(sorted);
      }
      setLoading(false);
    };
    fetchLocations();
  }, []);

  const handleLocationClick = (locName) => {
    if (currentLoc === locName) {
      navigate('/blog'); // 토글: 이미 선택된 경우 전체 보기
    } else {
      navigate(`/blog?location=${encodeURIComponent(locName)}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50/50">
      <div className="mb-6 px-2">
        <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-1">
          Explore
        </h3>
        <p className="text-sm text-gray-500 font-medium">
          세계 곳곳의 공개된 여정들
        </p>
      </div>

      <div className="space-y-1">
        <button
          onClick={() => navigate('/blog')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
            !currentLoc
              ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Hash size={18} className={!currentLoc ? 'text-blue-500' : 'text-gray-400'} />
            <span className="text-sm">전체 기록 보기</span>
          </div>
          {!currentLoc && <ChevronRight size={16} className="text-blue-500" />}
        </button>

        <div className="my-4 border-t border-gray-200" />

        <div className="px-2 mb-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass size={12} /> Popular Destinations
          </h4>
        </div>

        {loading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : locations.length > 0 ? (
          locations.map((loc, idx) => {
            const isSelected = currentLoc === loc.name;
            return (
              <button
                key={idx}
                onClick={() => handleLocationClick(loc.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  <MapPin size={16} className={isSelected ? 'text-blue-500' : 'text-gray-400 opacity-70'} />
                  <span className="text-sm truncate">{loc.name}</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {loc.count}
                </span>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-4 text-sm text-gray-400 text-center">
            공개된 장소가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicNav;
