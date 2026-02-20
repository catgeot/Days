// src/pages/Home/components/LogoPanel.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. 헤더 다이어트 (로고 축소, Passport Control 삭제, 프로필/로그아웃 상단 통합)
// 2. 여행 일지(My Travel Log) 버튼 디자인 축소
// 3. 🚨 스텔스 스크롤바 적용 및 다이렉트 오픈 파이프라인(onTripSelect) / 별표 토글(onToggleBookmark) 연결
// 4. 하단 푸터 명확한 구획 분리(bg-black)

import React from 'react';
import { X, LogIn, LogOut, Plane, Star, BookOpen, ChevronRight } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import Logo from './Logo'; 

// 🚨 [New] 전역 일기장 패널을 열기 위한 훅 로드
import { useReport } from '../../../context/ReportContext';

const LogoPanel = ({ isOpen, onClose, user, bucketList, onLogout, onToggleBookmark, onTripSelect }) => {
  const navigate = useNavigate();
  
  // 🚨 [New] 패널 조작 리모컨 가져오기
  const { openReport } = useReport();

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* 사이드 패널 */}
      <div 
        className={`fixed top-0 left-0 h-full w-full md:w-[450px] bg-[#0a0a0a] border-r border-white/10 z-50 transform transition-transform duration-500 ease-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* 1. 헤더 영역 (다이어트 & 컴팩트 통합) */}
        <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-black/50 backdrop-blur-md">
          <div className="scale-75 origin-left">
            <h2 className="text-3xl font-black text-white tracking-tighter">
              <Logo />
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 bg-white/5 py-1.5 px-3 rounded-full border border-white/10 shadow-inner">
                <div className="w-20 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white">
                  {user.email.split('@')[0].toUpperCase()}
                </div>
                <button 
                  onClick={onLogout}
                  title="Sign Out"
                  className="text-gray-400 hover:text-red-400 transition-colors ml-1"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white transition-colors border border-white/5 rounded-full hover:bg-white/5">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2. 메인 컨텐츠 영역 (스텔스 스크롤바 적용: 얇은 투명 선) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
          
          {user ? (
            <div className="space-y-8 animate-fade-in">
              
              {/* 여행 일지(My Travel Log) 컴팩트 버튼 */}
              <button 
                // 🚨 [Fix] 페이지 이동(navigate) 대신 오버레이 패널(openReport)을 열고, 로고 패널은 깔끔하게 닫아줌
                onClick={() => {
                  openReport('dashboard');
                  onClose(); 
                }}
                className="w-full group flex items-center justify-between py-3 px-5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-xl transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={18} className="text-blue-400" />
                  <span className="text-sm font-bold text-white tracking-wide">My Travel Log</span>
                </div>
                <ChevronRight size={16} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 버킷리스트 영역 */}
              <div>
                <div className="flex justify-between items-end mb-4 px-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                    My Bucket List
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">{bucketList.length} / 50</span>
                </div>

                {bucketList.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {bucketList.map((trip) => {
                      const keyword = encodeURIComponent(trip.destination || 'travel');
                      const thumbUrl = `https://picsum.photos/seed/${keyword}/400/400`;

                      return (
                        <div 
                          key={trip.id} 
                          onClick={() => onTripSelect(trip)} // 🚨 [New] 다이렉트 오픈 핸들러 연결
                          className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800 border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer"
                        >
                          <img 
                            src={thumbUrl} 
                            alt={trip.destination}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
                          
                          {/* 🚨 [New] 별표 토글 버튼 (이벤트 버블링 차단) */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); onToggleBookmark(trip.id); }}
                            className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/80 transition-all z-10"
                          >
                            <Star size={12} className={trip.is_bookmarked ? "text-yellow-400 fill-yellow-400" : "text-gray-400"} />
                          </button>

                          <div className="absolute bottom-3 left-3 right-3">
                            <p className="text-xs font-bold text-white leading-tight mb-1 truncate">{trip.destination}</p>
                            <p className="text-[9px] text-blue-400 tracking-wider font-mono uppercase">{trip.code}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <Plane size={32} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-sm text-gray-400">아직 담은 여행지가 없습니다.</p>
                    <p className="text-[10px] text-gray-600 mt-1">지구본에서 도시를 클릭하고 '별'을 눌러보세요!</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 비로그인 상태 */
            <div className="h-full flex flex-col justify-center items-center text-center space-y-8 animate-fade-in pb-10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2 border border-white/10">
                <BookOpen size={28} className="text-gray-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white tracking-tight">당신의 여행을 기록하세요</h3>
                <p className="text-gray-500 text-xs leading-relaxed max-w-[240px]">
                  로그인하면 나만의 버킷리스트를 만들고,<br/>
                  지구본의 모든 기능을 제한 없이<br/>
                  사용할 수 있습니다.
                </p>
              </div>
              
              <button 
                onClick={() => navigate('/auth/login')}
                className="w-full max-w-[180px] py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 group text-sm"
              >
                <LogIn size={16} className="group-hover:-translate-x-1 transition-transform" />
                SIGN IN
              </button>
            </div>
          )}
        </div>

        {/* 3. 푸터 영역 (명확한 구획 분리) */}
        <div className="p-5 border-t border-white/10 bg-black">
          <div className="flex justify-center items-center gap-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold">
            <button className="hover:text-white transition-colors">About Us</button>
            <span className="text-gray-800">|</span>
            <button className="hover:text-white transition-colors">Privacy Policy</button>
            <span className="text-gray-800">|</span>
            <button className="hover:text-white transition-colors">Contact</button>
          </div>
          <p className="text-center text-[8px] text-gray-700 mt-3 tracking-widest">© 2026 PROJECT DAYS.</p>
        </div>
      </div>
    </>
  );
};

export default LogoPanel;