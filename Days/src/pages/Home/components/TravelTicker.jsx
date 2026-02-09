// src/components/TravelTicker.jsx
import React, { useState, useEffect } from 'react';
import { Plane, CloudSun, Sun, CloudRain, Cloud, Wind, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// 🚨 [Fix/New] 하드코딩 데이터 삭제 -> 외부 데이터(trendingData) 연결
// 파일 위치가 'src/pages/Home/data/trendingData.js'라고 가정했습니다.
import { TRENDING_LIST } from '../data/trendingData';

// 기존 변수명 'cities'를 그대로 사용하여 하위 로직 변경 최소화
const cities = TRENDING_LIST;

const WeatherIcon = ({ type, size = 14 }) => {
  switch (type) {
    case 'sun': return <Sun size={size} className="text-yellow-400" />;
    case 'rain': return <CloudRain size={size} className="text-blue-400" />;
    case 'cloud': return <Cloud size={size} className="text-gray-300" />;
    case 'wind': return <Wind size={size} className="text-gray-400" />;
    default: return <CloudSun size={size} className="text-yellow-200" />;
  }
};

const RankChange = ({ type, size = 12 }) => {
  switch (type) {
    case 'up': return <TrendingUp size={size} className="text-red-400" />;
    case 'down': return <TrendingDown size={size} className="text-blue-400" />;
    default: return <Minus size={size} className="text-gray-500" />;
  }
};

export default function CombinedTravelTicker({ onCityClick, isExpanded: externalExpanded, onToggle }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  
  // 외부 제어 모드 지원 (HomeUI에서 제어)
  const isControlled = externalExpanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = isControlled ? externalExpanded : internalExpanded;

  useEffect(() => {
    let interval;
    if (!isExpanded) { 
      interval = setInterval(() => {
        setFade(false); 
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % cities.length);
          setFade(true); 
        }, 500); 
      }, 4000); 
    } else {
      clearInterval(interval); 
    }
    return () => clearInterval(interval);
  }, [isExpanded]);

  // 데이터 안전장치 (데이터가 아직 로드 안됐을 경우 대비)
  const currentCity = cities[currentIndex] || cities[0];

  const handleMouseLeave = () => {
    if (isExpanded) {
      if (onToggle) onToggle(false);
      else setInternalExpanded(false);
    }
  };

  const handleToggle = () => {
    if (onToggle) onToggle(!isExpanded);
    else setInternalExpanded(prev => !prev);
  };

  // 도시 클릭 시 상위 컴포넌트로 데이터 전달
  const handleCityClick = (e, city) => {
    e.stopPropagation(); // 부모의 toggle 이벤트 방지
    if (onCityClick) {
      onCityClick(city);
    }
  };

  if (!currentCity) return null; // 데이터 로딩 중 에러 방지

  return (
    <div
      className={`
        bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-60 hover:bg-black/30' : 'w-48 hover:bg-black/30 cursor-pointer'}
        group
      `}
      onMouseLeave={handleMouseLeave} 
      onClick={!isExpanded ? handleToggle : undefined} // 접혀있을 때만 전체 클릭으로 확장
    >

      <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2" onClick={isExpanded ? handleToggle : undefined}>
        <div className="text-[9px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-wider">
          <Plane size={10} className="animate-pulse text-blue-400" />
          {isExpanded ? 'Live Ranking' : 'Live Trending'}
        </div>
        {isExpanded ? (
          <span className="text-[8px] text-green-500 font-mono animate-pulse">● LIVE</span>
        ) : (
          <span className="text-[8px] text-gray-600 font-mono">UPDATED</span>
        )}
      </div>

      {isExpanded ? (
        <div className="flex flex-col gap-1">
          {cities.map((city) => (
            <div
              key={city.rank}
              onClick={(e) => handleCityClick(e, city)}
              className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold font-mono w-4 text-center ${city.rank <= 3 ? 'text-blue-400' : 'text-gray-500'}`}>
                  {city.rank}
                </span>

                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors">
                    {city.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <RankChange type={city.change} size={10} />
                    <span className="text-[8px] text-gray-500 uppercase">
                      {city.change === 'up' ? 'Rising' : city.change === 'down' ? 'Down' : '-'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <WeatherIcon type={city.weather} size={12} />
                <span className="text-xs font-medium text-gray-300 group-hover:text-white font-mono">{city.temp}°</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className={`flex justify-between items-center transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center justify-center w-5">
                <span className="font-mono text-lg font-bold text-white/40 leading-none">
                  {String(currentCity.rank).padStart(2, '0')}
                </span>
                <div className="mt-0.5"><RankChange type={currentCity.change} size={12} /></div>
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-sm text-white/90 tracking-wide">{currentCity.name}</span>
                <span className="text-[10px] text-gray-400">Popular Dest.</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <WeatherIcon type={currentCity.weather} size={14} />
              <span className="text-xs font-medium text-white/80 mt-0.5">{currentCity.temp}°</span>
            </div>
          </div>

          <div className="w-full h-0.5 bg-white/5 mt-3 rounded-full overflow-hidden">
            <div key={currentIndex} className="h-full bg-blue-500/50 w-full animate-progress-bar origin-left"></div>
          </div>
          <style>{`
            @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
            .animate-progress-bar { animation: progress 4s linear; }
          `}</style>
        </>
      )}

      {isExpanded && (
        <div className="text-[8px] text-center text-gray-600 font-mono tracking-[0.2em] border-t border-white/5 pt-2 mt-2">
          GATE 0 SYSTEM
        </div>
      )}
    </div>
  );
}