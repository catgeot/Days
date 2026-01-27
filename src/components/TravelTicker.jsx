import React, { useState, useEffect, useRef } from 'react';
import { Plane, CloudSun, Sun, CloudRain, Cloud, Wind, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// 공통 도시 데이터
const cities = [
  { rank: 1, name: 'Osaka', temp: 18, weather: 'sun', change: 'up' },
  { rank: 2, name: 'Da Nang', temp: 28, weather: 'cloud', change: 'same' },
  { rank: 3, name: 'Bangkok', temp: 32, weather: 'rain', change: 'up' },
  { rank: 4, name: 'Fukuoka', temp: 15, weather: 'sun', change: 'down' },
  { rank: 5, name: 'Tokyo', temp: 16, weather: 'cloud', change: 'up' },
  { rank: 6, name: 'Taipei', temp: 22, weather: 'rain', change: 'down' },
  { rank: 7, name: 'Nha Trang', temp: 29, weather: 'sun', change: 'same' },
  { rank: 8, name: 'Paris', temp: 12, weather: 'wind', change: 'up' },
  { rank: 9, name: 'New York', temp: 10, weather: 'wind', change: 'down' },
  { rank: 10, name: 'Sydney', temp: 24, weather: 'sun', change: 'up' },
];

// 공통 날씨 아이콘 컴포넌트 (크기 조정 가능하도록 props 추가)
const WeatherIcon = ({ type, size = 14 }) => {
  switch (type) {
    case 'sun': return <Sun size={size} className="text-yellow-400" />;
    case 'rain': return <CloudRain size={size} className="text-blue-400" />;
    case 'cloud': return <Cloud size={size} className="text-gray-300" />;
    case 'wind': return <Wind size={size} className="text-gray-400" />;
    default: return <CloudSun size={size} className="text-yellow-200" />;
  }
};

// 공통 랭크 변화 아이콘 컴포넌트 (크기 조정 가능하도록 props 추가)
const RankChange = ({ type, size = 12 }) => {
  switch (type) {
    case 'up': return <TrendingUp size={size} className="text-red-400" />;
    case 'down': return <TrendingDown size={size} className="text-blue-400" />;
    default: return <Minus size={size} className="text-gray-500" />;
  }
};

export default function CombinedTravelTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false); // 확장/축소 상태 관리

  // 롤링 효과 (확장되지 않았을 때만 작동)
  useEffect(() => {
    let interval;
    if (!isExpanded) { // 확장되지 않았을 때만 롤링
      interval = setInterval(() => {
        setFade(false); // 페이드 아웃
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % cities.length);
          setFade(true); // 페이드 인
        }, 500); // 0.5초 뒤 데이터 변경
      }, 4000); // 4초 간격
    } else {
      clearInterval(interval); // 확장되면 인터벌 정지
    }

    return () => clearInterval(interval);
  }, [isExpanded]); // isClicked 제거

  const currentCity = cities[currentIndex];

  // 마우스 이탈 시 축소
  const handleMouseLeave = () => {
    // 컴포넌트가 펼쳐진 상태일 때만 마우스 이탈 시 접힘
    if (isExpanded) {
      setIsExpanded(false);
    }
  };

  // 클릭 시 상태 전환
  const handleClick = () => {
    // isExpanded 상태를 토글합니다.
    setIsExpanded(prev => !prev); 
  };

  return (
    <div
      className={`
        bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-60 hover:bg-black/30' : 'w-48 hover:bg-black/30 cursor-pointer'}
        group
      `}
      // onMouseEnter는 제거하고, 클릭만으로 확장합니다.
      onMouseLeave={handleMouseLeave} // 마우스 이탈 시 접힘
      onClick={handleClick} // 클릭 시 확장/축소
    >

      {/* 헤더: Live Trending (기본 롤링 시) 또는 Live Ranking (전체 리스트 시) */}
      <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
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

      {/* 컨텐츠 영역: 확장 상태에 따라 다른 내용을 보여줌 */}
      {isExpanded ? (
        // ******************** 펼쳐진 상태 (전체 도시 목록) ********************
        <div className="flex flex-col gap-1">
          {cities.map((city) => (
            <div
              key={city.rank}
              className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              {/* 좌측: 순위 + 도시명 */}
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

              {/* 우측: 날씨 + 온도 */}
              <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <WeatherIcon type={city.weather} size={12} />
                <span className="text-xs font-medium text-gray-300 group-hover:text-white font-mono">{city.temp}°</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // ******************** 접힌 상태 (자동 롤링 단일 도시) ********************
        <>
          <div
            className={`flex justify-between items-center transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="flex items-center gap-3">
              {/* 순위 */}
              <div className="flex flex-col items-center justify-center w-5">
                <span className="font-mono text-lg font-bold text-white/40 leading-none">
                  {String(currentCity.rank).padStart(2, '0')}
                </span>
                <div className="mt-0.5"><RankChange type={currentCity.change} size={12} /></div>
              </div>

              {/* 도시 이름 */}
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white/90 tracking-wide">{currentCity.name}</span>
                <span className="text-[10px] text-gray-400">Popular Dest.</span>
              </div>
            </div>

            {/* 날씨 */}
            <div className="flex flex-col items-end">
              <WeatherIcon type={currentCity.weather} size={14} />
              <span className="text-xs font-medium text-white/80 mt-0.5">{currentCity.temp}°</span>
            </div>
          </div>

          {/* 하단: 프로그레스 바 (다음 순위까지 남은 시간) */}
          <div className="w-full h-0.5 bg-white/5 mt-3 rounded-full overflow-hidden">
            <div
              key={currentIndex} // 키가 바뀌면 애니메이션 재시작
              className="h-full bg-blue-500/50 w-full animate-progress-bar origin-left"
            ></div>
          </div>

          {/* 스타일: 프로그레스 바 애니메이션 정의 */}
          <style>{`
            @keyframes progress {
              from { transform: scaleX(0); }
              to { transform: scaleX(1); }
            }
            .animate-progress-bar {
              animation: progress 4s linear;
            }
          `}</style>
        </>
      )}

      {/* 하단 장식 (확장 시에만) */}
      {isExpanded && (
        <div className="text-[8px] text-center text-gray-600 font-mono tracking-[0.2em] border-t border-white/5 pt-2 mt-2">
          GATE 0 SYSTEM
        </div>
      )}
    </div>
  );
}