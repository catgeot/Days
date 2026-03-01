// 파일 1: src/components/PlaceCard/views/PlaceWikiNavView.jsx
// 🚨 [Fix] isWikiLoading 상태에 따른 스켈레톤 UI 추가
import React from 'react';
import { BookOpen } from 'lucide-react';

const PlaceWikiNavView = ({ wikiData, isWikiLoading, onNavClick }) => {
  return (
    <div className="animate-fade-in flex flex-col gap-4 p-8">
      <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        <BookOpen size={18} className="text-amber-400" />
        문서 목차
      </h2>
      
      {isWikiLoading ? (
        // 🚨 로딩 스켈레톤
        <div className="flex flex-col gap-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-white/5 border border-white/5 rounded-xl w-full"></div>
            ))}
        </div>
      ) : wikiData && wikiData.sections && wikiData.sections.length > 0 ? (
        <div className="flex flex-col gap-2">
          {wikiData.sections.map((sec, idx) => (
            <button 
              key={idx} 
              onClick={() => onNavClick(`wiki-section-${idx}`)}
              className="text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-sm border border-white/5 group"
            >
              <span className="text-amber-500/50 group-hover:text-amber-400 mr-2">{idx + 1}.</span> 
              {sec.title}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">등록된 목차가 없습니다.</p>
      )}
    </div>
  );
};

export default PlaceWikiNavView;