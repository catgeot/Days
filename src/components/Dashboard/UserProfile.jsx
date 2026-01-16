import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, User, ShieldCheck, Camera, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';

const UserProfile = ({ user, loading, onLogout }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showMemory, setShowMemory] = useState(false); // ✨ 사진 액자 보이기/숨기기 상태
  const fileInputRef = useRef(null);

  // 로딩 스켈레톤
  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // 사진 업로드 로직 (기존과 동일)
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true }; // 조금 더 좋은 화질로 변경
      const compressedFile = await imageCompression(file, options);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, compressedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(fileName);
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (updateError) throw updateError;

      alert("소중한 추억이 담겼습니다! ✨");
      window.location.reload(); 

    } catch (error) {
      console.error('업로드 실패:', error);
      alert("사진 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // 🟢 로그인 상태
  if (user) {
    const username = user.email.split('@')[0];
    const initial = user.email.charAt(0).toUpperCase();
    const avatarUrl = user.user_metadata?.avatar_url;

    return (
      <>
        {/* 1. 상단 프로필 바 */}
        <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-all">
          
          {/* 아바타 클릭 시 -> 액자 토글 (더 이상 바로 파일창이 열리지 않음) */}
          <div 
            className="relative w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all overflow-hidden"
            onClick={() => setShowMemory(!showMemory)} 
            title="추억 액자 열기"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-inner">
                {initial}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-800 text-sm">{username}</span>
              <ShieldCheck size={12} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium tracking-wide">
              {user.email}
            </span>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1"></div>

          <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50" title="로그아웃">
            <LogOut size={16} />
          </button>
        </div>


        {/* 2. ✨ [핵심 기능] 떠다니는 폴라로이드 액자 */}
        {showMemory && (
          <div className="fixed left-8 top-32 z-50 animate-fade-in-up hidden xl:block"> 
            {/* hidden xl:block -> 화면이 너무 작으면(모바일 등) 가립니다 (업무 방해 방지) */}
            
            <div className="bg-white p-3 pb-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rotate-[-2deg] rounded-sm transform transition-all hover:scale-105 hover:rotate-0 hover:z-[60] w-64 border border-gray-200">
              
              {/* 닫기 버튼 */}
              <button 
                onClick={() => setShowMemory(false)}
                className="absolute -top-3 -right-3 bg-gray-900 text-white p-1.5 rounded-full shadow-lg hover:bg-red-500 transition-colors z-10"
              >
                <X size={14} />
              </button>

              {/* 사진 영역 */}
              <div className="w-full aspect-[3/4] bg-gray-100 overflow-hidden relative group rounded-sm border border-gray-100">
                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <Loader2 size={30} className="animate-spin text-blue-500" />
                  </div>
                ) : (
                  <>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Memory" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <ImageIcon size={40} />
                        <span className="text-xs mt-2">사진을 등록해주세요</span>
                      </div>
                    )}
                    
                    {/* 사진 변경 버튼 (마우스 올리면 뜸) */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => fileInputRef.current.click()}
                        className="bg-white/20 backdrop-blur-md border border-white/50 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-white/40 transition-all"
                      >
                        <Camera size={14} /> 사진 변경
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 하단 텍스트 (감성) */}
              <div className="text-center mt-4">
                <p className="font-handwriting text-gray-600 text-sm font-bold opacity-80" style={{ fontFamily: 'cursive' }}>
                  My Motivation ✈️
                </p>
              </div>

              {/* 숨겨진 파일 입력창 */}
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            
            </div>
          </div>
        )}
      </>
    );
  }

  // ⚪ 비로그인 상태 (기존 유지)
  return (
    <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-gray-100 shadow-sm">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><User size={20} /></div>
      <div className="flex flex-col"><span className="font-bold text-gray-800 text-sm">방문자 (Guest)</span><span className="text-[10px] text-gray-400">로그인이 필요합니다</span></div>
      <div className="w-px h-6 bg-gray-200 mx-1"></div>
      <Link to="/auth/login" className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"><LogIn size={16} /></Link>
    </div>
  );
};

export default UserProfile;