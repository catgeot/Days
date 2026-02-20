// src/pages/Home/components/LogoPanel.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fact Check] Unsplash 검색 언어(영어)와 Supabase DB 조회 언어(한국어) 불일치로 인한 DB 업데이트 누락 버그 해결.
// 2. [Schema First] place_stats 테이블의 'place_id' 컬럼을 기준으로 image_url을 조회 및 업데이트하도록 수정.
// 3. 변수명 충돌(query is not defined) 에러를 originName과 searchQuery로 명확히 분리하여 원천 차단.

import React, { useState, useEffect } from 'react';
import { X, LogIn, LogOut, Plane, Star, BookOpen, ChevronRight } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import Logo from './Logo'; 

// 전역 훅 및 API 클라이언트
import { useReport } from '../../../context/ReportContext';
import { apiClient } from '../lib/apiClient';
import { supabase } from '../../../shared/api/supabase';

// 🚨 [New] 영어 검색어 변환을 위한 로컬 데이터 로드
import { TRAVEL_SPOTS } from '../data/travelSpots';

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const CACHE_VERSION = 'v1.3'; 

const BucketListCard = ({ trip, onTripSelect, onToggleBookmark }) => {
  const [thumbUrl, setThumbUrl] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchThumbnail = async () => {
      // 🚨 [Fix] 역할 분리: DB 통신용(한국어) vs API/Cache 통신용(영어)
      const originName = trip.destination || 'travel';
      const realSpot = TRAVEL_SPOTS.find(s => s.name === originName);
      const searchQuery = realSpot ? (realSpot.name_en || realSpot.name) : originName;

      const CACHE_KEY = `days_gallery_${searchQuery}`;

      // 1. Safe Path 1: 스마트 캐시 확인 (영어 키 사용)
      try {
        const cachedItem = sessionStorage.getItem(CACHE_KEY);
        if (cachedItem) {
          const parsed = JSON.parse(cachedItem);
          if (parsed.version === CACHE_VERSION && parsed.data && parsed.data.length > 0) {
            if (isMounted) {
              setThumbUrl(parsed.data[0].urls.small || parsed.data[0].urls.regular);
              setIsLoaded(true);
            }
            return;
          }
        }
      } catch (e) {
        console.warn("Cache parse error", e);
      }

      // 2. Safe Path 2: DB place_stats 확인 (한국어 이름 사용)
      try {
        const { data: statsData, error: statsError } = await supabase
          .from('place_stats')
          .select('image_url')
          .eq('place_id', originName) // 🚨 DB는 한국어로 기록되어 있음
          .maybeSingle();

        if (statsData && statsData.image_url) {
          if (isMounted) {
            setThumbUrl(statsData.image_url);
            setIsLoaded(true);
          }
          return;
        }

        // 3. Safe Path 3: Unsplash API 호출 후 DB 업데이트
        if (!ACCESS_KEY) return;
        
        // 🚨 API는 영어로 검색해야 결과가 잘 나옴
        const results = await apiClient.fetchUnsplashImages(ACCESS_KEY, searchQuery);
        
        if (isMounted && results.length > 0) {
          const newImageUrl = results[0].urls.small || results[0].urls.regular;
          setThumbUrl(newImageUrl);
          
          // 🚨 낙관적 DB 업데이트: 다시 한국어 이름(originName)으로 매칭해서 업데이트
          supabase
            .from('place_stats')
            .update({ image_url: newImageUrl })
            .eq('place_id', originName)
            .then();
        }
      } catch (error) {
        console.error("Thumbnail Fetch Error in LogoPanel:", error);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    fetchThumbnail();
    return () => { isMounted = false; };
  }, [trip.destination]);

  const finalImgSrc = thumbUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80';

  return (
    <div 
      onClick={() => onTripSelect(trip)} 
      className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800 border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer"
    >
      <img 
        src={finalImgSrc} 
        alt={trip.destination}
        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70 group-hover:opacity-100 ${isLoaded ? 'blur-0' : 'blur-sm grayscale'}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
      
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
};

const LogoPanel = ({ isOpen, onClose, user, bucketList, onLogout, onToggleBookmark, onTripSelect }) => {
  const navigate = useNavigate();
  const { openReport } = useReport();

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <div 
        className={`fixed top-0 left-0 h-full w-full md:w-[450px] bg-[#0a0a0a] border-r border-white/10 z-50 transform transition-transform duration-500 ease-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
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

        <div className="flex-1 overflow-y-auto p-6 space-y-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
          
          {user ? (
            <div className="space-y-8 animate-fade-in">
              <button 
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
                    {bucketList.map((trip) => (
                      <BucketListCard 
                        key={trip.id} 
                        trip={trip} 
                        onTripSelect={onTripSelect} 
                        onToggleBookmark={onToggleBookmark} 
                      />
                    ))}
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