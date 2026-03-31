import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

const PlaceWikiNavView = ({ wikiData, isWikiLoading, onNavClick, placeName }) => {
  const [activeSection, setActiveSection] = useState(null);

  const handleRemoteAiRequest = () => {
      setActiveSection('ai');
      window.dispatchEvent(new CustomEvent('request-ai-info', {
          detail: { placeName: placeName }
      }));
  };

  const handleSectionClick = (idx) => {
      setActiveSection(idx);
      onNavClick(`wiki-section-${idx}`);
  };

  return (
    <div className="animate-fade-in flex flex-col h-full p-8 pb-6">
      <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2 shrink-0">
        <BookOpen size={18} className="text-amber-400" />
        문서 목차
      </h2>

      {isWikiLoading ? (
        <div className="flex flex-col gap-3 animate-pulse flex-1">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-white/5 border border-white/5 rounded-xl w-full"></div>
            ))}
        </div>
      ) : (
        <>
            {wikiData && wikiData.sections && wikiData.sections.length > 0 ? (
                <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                  {wikiData.sections.map((sec, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSectionClick(idx)}
                      className={`text-left px-4 py-3 rounded-xl transition-all text-sm border group
                          ${activeSection === idx
                              ? 'bg-white/10 border-white/20 text-white font-medium shadow-md'
                              : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/5'
                          }
                      `}
                    >
                      <span className={`${activeSection === idx ? 'text-amber-400' : 'text-amber-500/50 group-hover:text-amber-400'} mr-2`}>
                          {idx + 1}.
                      </span>
                      {sec.title}
                    </button>
                  ))}
                </div>
            ) : (
                <p className="text-gray-400 text-sm flex-1 mb-4">등록된 목차가 없습니다.</p>
            )}

            {/* 🆕 [Phase 9-3] wikiData 없어도 버튼 표시 (검색/지오코딩 진입 대응) */}
            <div className="mt-auto pt-4 border-t border-white/10 shrink-0">
                <button
                    onClick={handleRemoteAiRequest}
                    className={`w-full group flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 shadow-lg border
                        ${activeSection === 'ai'
                            ? 'bg-gradient-to-r from-blue-600/40 to-purple-600/40 border-blue-400/50 ring-2 ring-blue-500/30'
                            : 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border-blue-500/30'
                        }
                    `}
                >
                    <Sparkles size={16} className={`group-hover:scale-110 transition-transform ${activeSection === 'ai' ? 'text-white' : 'text-blue-400'}`} />
                    <span className={`text-sm font-bold tracking-wide ${activeSection === 'ai' ? 'text-white' : 'text-gray-200'}`}>
                        제미나이에게 최신 정보 요청
                    </span>
                </button>
            </div>
        </>
      )}
    </div>
  );
};

export default PlaceWikiNavView;
