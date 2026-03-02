import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

const PlaceWikiNavView = ({ wikiData, isWikiLoading, onNavClick }) => {
  // 🚨 [New] 원격 트리거 핸들러
  const handleRemoteAiRequest = () => {
      window.dispatchEvent(new CustomEvent('request-ai-info'));
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4 p-8">
      <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        <BookOpen size={18} className="text-amber-400" />
        문서 목차
      </h2>
      
      {isWikiLoading ? (
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
          
          {/* 🚨 [New] 제미나이 원격 요청 버튼 (Nav용) */}
          <div className="mt-4 pt-4 border-t border-white/10">
              <button 
                  onClick={handleRemoteAiRequest}
                  className="w-full group flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-xl transition-all duration-300 shadow-lg"
              >
                  <Sparkles size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-gray-200 tracking-wide">
                      제미나이에게 최신 정보 받기
                  </span>
              </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">등록된 목차가 없습니다.</p>
      )}
    </div>
  );
};

export default PlaceWikiNavView;