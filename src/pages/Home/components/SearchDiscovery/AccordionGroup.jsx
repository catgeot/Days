import React from 'react';
import { ChevronDown, Compass } from 'lucide-react';
import SpotThumbnailCard from './SpotThumbnailCard';

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

export default AccordionGroup;
