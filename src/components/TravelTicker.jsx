import React from 'react';
import { Plane, CloudSun, Sun, CloudRain, Cloud, Wind, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

const WeatherIcon = ({ type }) => {
  switch (type) {
    case 'sun': return <Sun size={12} className="text-yellow-400" />;
    case 'rain': return <CloudRain size={12} className="text-blue-400" />;
    case 'cloud': return <Cloud size={12} className="text-gray-300" />;
    case 'wind': return <Wind size={12} className="text-gray-400" />;
    default: return <CloudSun size={12} className="text-yellow-200" />;
  }
};

const RankChange = ({ type }) => {
  switch (type) {
    case 'up': return <TrendingUp size={10} className="text-red-400" />;
    case 'down': return <TrendingDown size={10} className="text-blue-400" />;
    default: return <Minus size={10} className="text-gray-500" />;
  }
};

export default function TravelTicker() {
  return (
    <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-60 shadow-2xl flex flex-col gap-3 transition-all hover:bg-black/30">
      
      {/* 헤더 */}
      <div className="flex justify-between items-end border-b border-white/10 pb-2">
        <div className="flex flex-col">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <Plane size={10} className="text-blue-400" /> Live Ranking
          </span>
          <span className="text-xs text-white/90 font-bold mt-0.5">Top 10 Destinations</span>
        </div>
        <span className="text-[8px] text-green-500 font-mono animate-pulse">● LIVE</span>
      </div>

      {/* 리스트 영역 (10개) */}
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
                  <RankChange type={city.change} />
                  <span className="text-[8px] text-gray-500 uppercase">
                    {city.change === 'up' ? 'Rising' : city.change === 'down' ? 'Down' : '-'}
                  </span>
                </span>
              </div>
            </div>

            {/* 우측: 날씨 + 온도 (항상 보이되, 깔끔하게) */}
            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <WeatherIcon type={city.weather} />
              <span className="text-xs font-medium text-gray-300 group-hover:text-white font-mono">{city.temp}°</span>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 장식 */}
      <div className="text-[8px] text-center text-gray-600 font-mono tracking-[0.2em] border-t border-white/5 pt-2">
        GATE 0 SYSTEM
      </div>
    </div>
  );
}