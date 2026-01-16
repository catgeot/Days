import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, User, ShieldCheck, Camera, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';

const UserProfile = ({ user, loading, onLogout }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 로딩 중 (스켈레톤)
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

  // ✨ 프로필 사진 업로드 처리 함수
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // 1. 이미지 압축 (프로필은 작아도 되니까 가볍게)
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 300, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      // 2. Storage에 업로드 (파일명: 유저ID_시간)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles') // 🚨 Supabase에 'profiles' 버킷을 꼭 만들어주세요!
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      // 3. 이미지 주소 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      // 4. 유저 정보(Metadata)에 사진 주소 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      // 5. 성공 시 새로고침 (즉시 반영을 위해)
      alert("프로필 사진이 변경되었습니다! ✨");
      window.location.reload(); 

    } catch (error) {
      console.error('업로드 실패:', error);
      alert("사진 업로드 중 오류가 발생했습니다. ('profiles' 버킷이 있는지 확인해주세요)");
    } finally {
      setIsUploading(false);
    }
  };

  // 🟢 로그인 상태일 때
  if (user) {
    const username = user.email.split('@')[0];
    const initial = user.email.charAt(0).toUpperCase();
    // 저장된 아바타 URL 확인
    const avatarUrl = user.user_metadata?.avatar_url;

    return (
      <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-all">
        
        {/* ✨ [핵심] 클릭 가능한 아바타 영역 */}
        <div 
          className="relative w-10 h-10 rounded-full cursor-pointer group overflow-hidden"
          onClick={() => !isUploading && fileInputRef.current.click()} // 클릭 시 파일창 열기
          title="프로필 사진 변경"
        >
          {/* A. 업로드 중일 때 (로딩) */}
          {isUploading ? (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* B. 사진이 있을 때 vs 없을 때(이니셜) */}
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-inner">
                  {initial}
                </div>
              )}

              {/* C. 마우스 올렸을 때 뜨는 검은 막(Overlay) + 카메라 아이콘 */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={16} className="text-white" />
              </div>
            </>
          )}

          {/* 숨겨진 파일 입력창 */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* 유저 정보 */}
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

        <button 
          onClick={onLogout}
          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
          title="로그아웃"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  // ⚪ 비로그인 상태 (기존 동일)
  return (
    <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-gray-100 shadow-sm">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <User size={20} />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-gray-800 text-sm">방문자 (Guest)</span>
        <span className="text-[10px] text-gray-400">로그인이 필요합니다</span>
      </div>
      <div className="w-px h-6 bg-gray-200 mx-1"></div>
      <Link to="/auth/login" className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors">
        <LogIn size={16} />
      </Link>
    </div>
  );
};

export default UserProfile;