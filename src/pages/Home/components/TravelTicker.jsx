// src/pages/Home/components/TravelTicker.jsx
// 🚨 [Fix] Dumb Component화: 외부에서 데이터를 주입받도록 변경

import React, { useState, useEffect } from 'react';
import { Plane, CloudSun, Sun, CloudRain, Cloud, Wind, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

// 🚨 [Change] props에 'data' 추가 (기본값 빈 배열)
export default function TravelTicker({ data = [], onCityClick, isExpanded: externalExpanded, onToggle }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  
  // 외부 제어 모드 지원
  const isControlled = externalExpanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = isControlled ? externalExpanded : internalExpanded;

  // 🚨 [Fix] 데이터가 바뀔 때 인덱스 초기화 방지 로직 필요하면 추가
  const cities = data.length > 0 ? data : []; 

  useEffect(() => {
    if (cities.length === 0) return; // 데이터 없으면 루프 안 돔

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
  }, [isExpanded, cities.length]); // cities.length 의존성 추가

  // 데이터 안전장치
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

  const handleCityClick = (e, city) => {
    e.stopPropagation(); 
    if (onCityClick) {
      onCityClick(city);
    }
  };

  // 🚨 [Fix] 데이터가 아예 없을 때(로딩 전) 렌더링 방지
  if (!currentCity) return null; 

  return (
    <div
      className={`
        bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-60 hover:bg-black/30' : 'w-48 hover:bg-black/30 cursor-pointer'}
        group
      `}
      onMouseLeave={handleMouseLeave} 
      onClick={!isExpanded ? handleToggle : undefined} 
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
              key={city.rank} // rank를 키로 사용
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