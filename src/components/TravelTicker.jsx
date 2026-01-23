// src/components/TravelTicker.jsx
import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, ChevronDown } from 'lucide-react';
import { TRAVEL_SPOTS } from '../../src/date/travelSpots';

const TravelTicker = ({ 
  onCityClick,
  isExpanded, 
  onToggle 
}) => {
  const sortedSpots = [...TRAVEL_SPOTS].sort((a, b) => a.rank - b.rank).slice(0, 10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // 자동 롤링 (3초)
  useEffect(() => {
    if (isExpanded || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedSpots.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isExpanded, isHovered, sortedSpots.length]);

  const currentSpot = sortedSpots[currentIndex];

  return (
    <div 
      className="relative z-50 flex flex-col items-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); if(isExpanded) onToggle(false); }}
    >
      {/* 1. Compact Bar (평소 모습) */}
      <button 
        onClick={() => onToggle(!isExpanded)}
        className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 hover:bg-black/60 transition-all shadow-lg group"
      >
        <div className="flex items-center gap-2 text-yellow-400">
          <Trophy size={14} />
          <span className="text-xs font-bold font-mono">TOP 10</span>
        </div>
        <div className="w-px h-3 bg-white/20"></div>
        <div className="flex items-center gap-2 w-32 justify-between">
           <div className="flex items-center gap-2 overflow-hidden">
             <span className="text-xs font-bold text-white whitespace-nowrap">
               {currentSpot.rank}. {currentSpot.name}
             </span>
             <span className="text-[10px] opacity-70">
                {currentSpot.category === 'paradise' && '💎'}
                {currentSpot.category === 'nature' && '🏔️'}
                {currentSpot.category === 'urban' && '🏙️'}
             </span>
           </div>
           <ChevronDown size={12} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* 2. Expanded List (HUD Style - No Scroll) */}
      {isExpanded && (
        <div className="absolute top-14 right-0 w-72 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden">
           {/* Header */}
           <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-gradient-to-r from-blue-900/40 to-purple-900/40">
             <TrendingUp size={16} className="text-yellow-400" />
             <span className="text-sm font-bold text-white tracking-wide">Global Ranking</span>
           </div>
           
           {/* List Body (스크롤 없이 전체 표시) */}
           <div className="py-2">
             {sortedSpots.map((spot) => (
               <button
                 key={spot.id}
                 onClick={() => { onCityClick(spot); onToggle(false); }}
                 className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 transition-colors group/item"
               >
                 <div className="flex items-center gap-3">
                   {/* Rank Badge */}
                   <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono 
                     ${spot.rank <= 3 ? 'text-yellow-400 bg-yellow-400/10 ring-1 ring-yellow-400/30' : 'text-gray-400 bg-white/5'}`}>
                     {spot.rank}
                   </div>
                   
                   {/* Name & Country */}
                   <div className="text-left">
                     <p className="text-sm font-medium text-gray-200 group-hover/item:text-white transition-colors leading-none mb-0.5">
                       {spot.name}
                     </p>
                     <p className="text-[10px] text-gray-500 font-medium">
                       {spot.country}
                     </p>
                   </div>
                 </div>

                 {/* Icon */}
                 <div className="text-base opacity-60 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all">
                    {spot.category === 'paradise' && '💎'}
                    {spot.category === 'nature' && '🏔️'}
                    {spot.category === 'urban' && '🏙️'}
                    {spot.category === 'nearby' && '✈️'}
                    {spot.category === 'adventure' && '🧗'}
                 </div>
               </button>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default TravelTicker;