// 파일 2: src/components/PlaceCard/views/PlaceWikiDetailsView.jsx
// 🚨 [Fix] isWikiLoading 상태에 따른 스켈레톤 UI 추가
import React from 'react';
import { BookOpen } from 'lucide-react';

const PlaceWikiDetailsView = ({ wikiData, isWikiLoading }) => {
  return (
    <div className="w-full h-full flex flex-col p-8 md:p-12 overflow-y-auto text-white custom-scrollbar">
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}</style>

        <div className="max-w-3xl mx-auto w-full pt-16 md:pt-0 pb-20">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <BookOpen size={28} className="text-amber-500" />
                위키백과
            </h1>
            
            {isWikiLoading ? (
                // 🚨 로딩 스켈레톤
                <div className="space-y-8 animate-pulse">
                    <div className="h-32 bg-white/5 rounded-2xl border border-white/10 w-full"></div>
                    <div className="space-y-4 pt-8 border-t border-white/10">
                        <div className="h-8 bg-white/10 rounded w-1/3"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-white/5 rounded w-full"></div>
                            <div className="h-4 bg-white/5 rounded w-5/6"></div>
                            <div className="h-4 bg-white/5 rounded w-4/6"></div>
                        </div>
                    </div>
                </div>
            ) : wikiData ? (
                <div className="space-y-8 animate-fade-in">
                    <p className="text-gray-300 leading-relaxed text-2xl bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg whitespace-pre-line">
                        {wikiData.summary}
                    </p>
                    
                    {wikiData.sections && wikiData.sections.map((sec, idx) => (
                        <section key={idx} id={`wiki-section-${idx}`} className="pt-8 border-t border-white/10 scroll-mt-8">
                            <h3 className="text-2xl font-bold mb-4 text-amber-100">{sec.title}</h3>
                            <p className="text-gray-400 leading-relaxed whitespace-pre-line">{sec.content}</p>
                        </section>
                    ))}
                    
                    {wikiData.source_url && (
                        <div className="pt-8 mt-8 border-t border-white/5">
                            <a 
                                href={wikiData.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                위키백과 원문 보기 ↗
                            </a>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 gap-4 animate-fade-in">
                    <BookOpen size={48} className="opacity-20" />
                    <p>아직 이 장소의 백과사전 정보가 준비되지 않았습니다.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default PlaceWikiDetailsView;