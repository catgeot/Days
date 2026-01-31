import React, { useState } from 'react';
import { 
  X, MessageSquare, Play, Maximize2, Send, ArrowLeft, Video, 
  MoreHorizontal, Sparkles, Expand, PlayCircle 
} from 'lucide-react';

/**
 * 🚨 [Fix] TestBench B - Deep Blue Heritage Edition
 * - Design: 장소 카드의 Deep Blue & Cyan 색상 코드 완벽 승계
 * - Structure: 접힘 단계 없는 '독립형 확장 창' 복구
 * - Feature: 스크롤바 최적화, 사진 클릭 시 토글 로직, Home 탭 추가
 */

const TestBench = ({ onClose }) => {
  const [isChatting, setIsChatting] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex p-6 gap-6 animate-fade-in overflow-hidden font-sans">
      
      {/* 1. 좌측 상단 Home 탭 (벤치마크 라벨 대체) */}
      <div className="absolute top-8 left-8 z-[110]">
         <button 
             onClick={onClose}
             className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full text-blue-300 hover:text-white hover:border-blue-500/50 transition-all text-xs font-bold backdrop-blur-md shadow-lg"
         >
             <ArrowLeft size={14} /> Home
         </button>
      </div>

      {/* 2. 좌측 영역: Narrative & Control (35%) */}
      {/* 🚨 [Fix] 배경색 및 보더를 장소 카드 색상 코드(black/70 + blue accent)로 조정 */}
      <div className="w-[35%] h-full bg-[#05070a]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col relative shadow-2xl overflow-hidden">
        
        {/* [Header] 타이틀 및 설명 */}
        <div className="pt-20 px-8 pb-6 flex flex-col gap-3 z-10">
          <div className="flex items-start justify-between">
             <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} className="text-cyan-400" />
                  <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">Japan</span>
                </div>
                <h1 className={`font-black tracking-tighter text-white transition-all duration-500 ${selectedImg || isChatting ? 'text-4xl' : 'text-6xl'}`}>
                    OSAKA
                </h1>
             </div>
             
             {/* Watch 버튼 (채팅 중일 때 미디어 복귀용) */}
             {(isChatting || selectedImg) && (
               <button 
                 onClick={() => {setIsChatting(false); setSelectedImg(null);}}
                 className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all animate-fade-in"
               >
                 <Video size={14} /> <span>Watch</span>
               </button>
             )}
          </div>

          {/* 서정적 설명구 (🚨 2~3줄 고정 및 색상 승계) */}
          <div className={`overflow-hidden transition-all duration-500 ${selectedImg || isChatting ? 'max-h-0 opacity-0' : 'max-h-40 opacity-100'}`}>
            <p className="text-gray-300 text-sm leading-relaxed font-light">
              네온 사인이 도톤보리 강물 위로 춤추는 미식의 성지.<br/>
              <span className="text-blue-300/90 font-medium">과거와 미래가 교차하는 푸른 밤</span>의 정취 속에서<br/> 
              당신만의 특별한 오사카 이야기를 시작해보세요.
            </p>
          </div>
        </div>

        {/* [Middle] 콘텐츠 영역 (🚨 스크롤바 자연스럽게 처리) */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar-blue">
          {isChatting ? (
            <div className="h-full flex flex-col animate-fade-in">
               <div className="flex-1 space-y-4 py-2">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none text-sm text-gray-200 leading-relaxed border border-white/5">
                      안녕하세요! 오사카의 푸른 밤을 가이드해 드릴게요.<br/>
                      무엇이든 물어봐 주세요.
                    </div>
                  </div>
               </div>
            </div>
          ) : (
             <div className="space-y-4 animate-fade-in-up">
                <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-lg hover:shadow-blue-500/20 transition-all duration-500">
                  <img 
                    src={`https://img.youtube.com/vi/C9tY814tG48/maxresdefault.jpg`} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300 shadow-xl">
                      <Play size={24} className="text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-3">
                      <div className="w-16 h-10 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 cursor-pointer transition-colors"></div>
                      <div className="w-16 h-10 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 cursor-pointer transition-colors"></div>
                   </div>
                   <button className="text-xs text-gray-500 hover:text-blue-300 flex items-center gap-1 transition-colors font-medium">
                     <MoreHorizontal size={14} /> More
                   </button>
                </div>
             </div>
          )}
        </div>

        {/* [Bottom] 입력창 영역 */}
        <div className="p-6 pt-0 mt-auto">
          {isChatting ? (
            <div className="relative group">
              <input type="text" placeholder="오사카 맛집 추천해줘..." className="w-full bg-black/40 border border-white/10 rounded-full py-4 pl-6 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner" autoFocus />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-cyan-500 transition-all shadow-lg">
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsChatting(true)}
              className="w-full py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-blue-900/20 text-gray-300 hover:text-white font-medium flex items-center justify-center gap-3 transition-all group backdrop-blur-sm"
            >
              <MessageSquare size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="tracking-wide text-sm">AI 가이드에게 질문하기</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. 우측 영역: Media Gallery (65%) */}
      <div className="flex-1 h-full bg-[#05070a]/80 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl">
        {selectedImg ? (
          /* 상세 보기 모드 - 🚨 [Fix] 사진 클릭 시 복귀 로직 */
          <div className="w-full h-full relative animate-fade-in bg-black cursor-pointer" onClick={() => setSelectedImg(null)}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/5 text-9xl font-black italic tracking-tighter">PHOTO {selectedImg}</span>
                {/* 실제 이미지가 들어갈 공간 */}
              </div>
              
              {/* 우측 상단 기능 버튼 (이벤트 전파 방지 적용) */}
              <div className="absolute top-8 right-8 flex items-center gap-3 z-20" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="p-3 bg-black/50 backdrop-blur-md border border-white/10 text-white/50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                  title="Fullscreen"
                >
                  <Expand size={20} />
                </button>
                <button 
                  onClick={() => setSelectedImg(null)}
                  className="p-3 bg-black/50 backdrop-blur-md border border-white/10 text-white/50 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl"
                >
                  <X size={20} />
                </button>
              </div>
          </div>
        ) : (
          /* Bento Grid */
          <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar-blue">
             <div className="grid grid-cols-4 grid-rows-3 gap-4 h-full min-h-[600px]">
                {/* 1번: 대형 */}
                <div onClick={() => setSelectedImg(1)} className="col-span-2 row-span-2 bg-white/5 rounded-[2rem] border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all duration-500 group relative overflow-hidden shadow-lg hover:shadow-blue-500/20">
                   <div className="absolute inset-0 flex items-center justify-center text-gray-800 font-black text-4xl group-hover:text-blue-400/50 transition-colors">01</div>
                   <Maximize2 className="absolute top-6 right-6 text-white/0 group-hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100" size={24}/>
                </div>
                
                {/* 2~8번 생략 생략 (이전과 동일 그리드 구조) */}
                {[2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} onClick={() => setSelectedImg(i)} className={`${i === 4 ? 'col-span-2' : 'col-span-1'} row-span-1 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all group relative`}>
                     <div className="absolute inset-0 flex items-center justify-center text-gray-800 font-bold group-hover:text-blue-400/50">{i < 10 ? `0${i}` : i}</div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* 스타일 정의: 스크롤바 커스텀 */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-blue::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar-blue::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-blue::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.2), transparent);
          border-radius: 10px;
        }
        .custom-scrollbar-blue::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
      `}} />

      {/* 전체 닫기 버튼 */}
      <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white hover:rotate-90 transition-all z-[120]"><X size={24}/></button>
    </div>
  );
};

export default TestBench;