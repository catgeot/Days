import React, { useState } from 'react';
import { X, MessageSquare, Play, Maximize2, Send, ArrowLeft, Video, FlaskConical } from 'lucide-react';

// 🚨 [Type] TestBench A (Stable Version)
// - Layout: Split (Left 35% / Right 65%)
// - Feature: YouTube button moved to header icon

const TestBenchA = ({ onClose }) => {
  const [isChatting, setIsChatting] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  
  // 가상의 데이터 (멀티 유튜브/사진)
  const videoList = ["C9tY814tG48", "m_S_m79pTCE"]; 
  const photoList = [1, 2, 3, 4];

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex p-4 gap-4 animate-fade-in overflow-hidden">
      
      {/* 🏷️ Lab Label */}
      <div className="absolute top-6 left-6 z-[110] px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 flex items-center gap-2 backdrop-blur-md">
         <FlaskConical size={14} className="text-blue-400" />
         <span className="text-[10px] font-bold tracking-widest text-blue-400">BENCH A</span>
      </div>

      {/* 1. 좌측 영역: AI & INFO (35%) */}
      <div className="w-[35%] h-full bg-white/5 border border-blue-500/20 rounded-[2.5rem] flex flex-col overflow-hidden transition-all duration-500 relative">
        
        {/* [상단] 지명 및 축소된 유튜브 버튼 */}
        <div className="p-8 pb-4 mt-8 flex items-center justify-between">
          <div>
            <h1 className={`font-black text-white transition-all ${selectedImg || isChatting ? 'text-2xl' : 'text-5xl'}`}>OSAKA</h1>
            {(!selectedImg && !isChatting) && <p className="text-gray-400 mt-2">미식의 성지</p>}
          </div>
          
          {/* 🚨 [Fix/New] 디자인 변경: 버튼 아이콘화 및 헤더 배치 */}
          {(selectedImg || isChatting) && (
            <button className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-all animate-fade-in">
              <Video size={14} /> <span>Watch</span>
            </button>
          )}
        </div>

        {/* [중앙] 가변 콘텐츠 영역 */}
        <div className="flex-1 px-8 overflow-y-auto">
          {isChatting ? (
            /* --- 대화 모드 --- */
            <div className="h-full flex flex-col animate-fade-in">
               <div className="flex-1 space-y-4 py-4">
                  <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none text-sm text-gray-300">오사카의 어떤 것이 궁금하신가요?</div>
               </div>
            </div>
          ) : selectedImg ? (
            /* --- 사진 확대 시: 좌측에 나열되는 리스트 (비디오+나머지 사진) --- */
            <div className="space-y-4 animate-fade-in-right">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gallery & Videos</span>
              {/* 비디오 리스트 */}
              {videoList.map((id, idx) => (
                <div key={idx} className="w-full aspect-video bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-center group cursor-pointer">
                  <Play size={20} className="text-red-500 group-hover:scale-125 transition-transform" />
                </div>
              ))}
              {/* 나머지 사진 리스트 */}
              {photoList.filter(p => p !== selectedImg).map((p) => (
                <div key={p} onClick={() => setSelectedImg(p)} className="w-full h-24 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all" />
              ))}
            </div>
          ) : (
            /* --- 초기 모드: 메인 유튜브 대기 --- */
            <div className="w-full aspect-video bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group cursor-pointer relative overflow-hidden">
               <Play size={40} className="text-white/50 group-hover:text-white transition-all z-10" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
          )}
        </div>

        {/* [하단] 대화 시작/입력 버튼 */}
        <div className="p-6 border-t border-white/5">
          {isChatting ? (
            <div className="relative flex items-center">
              <input type="text" placeholder="메시지 입력..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-500/50" />
              <button className="absolute right-3 text-blue-500"><Send size={18}/></button>
            </div>
          ) : (
            <button 
              onClick={() => setIsChatting(true)}
              className="w-full py-4 bg-blue-600 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all"
            >
              <MessageSquare size={18} /> AI 가이드와 대화
            </button>
          )}
        </div>
      </div>

      {/* 2. 우측 영역: 메인 캔버스 (65%) */}
      <div className="flex-1 h-full relative">
        {selectedImg ? (
          <div className="w-full h-full bg-white/5 rounded-[3rem] border border-blue-500/20 flex items-center justify-center animate-fade-in">
             <span className="text-white/10 text-4xl font-black italic">PHOTO {selectedImg}</span>
             <button onClick={() => setSelectedImg(null)} className="absolute top-8 right-8 p-3 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-all">
               <ArrowLeft size={24} />
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
            {photoList.map((i) => (
              <div key={i} onClick={() => setSelectedImg(i)} className="bg-white/5 rounded-[2.5rem] border border-white/10 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-center group">
                 <Maximize2 size={30} className="text-white/0 group-hover:text-white/50 transition-all" />
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"><X size={24}/></button>
    </div>
  );
};

export default TestBenchA;