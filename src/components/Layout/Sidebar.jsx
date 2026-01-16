import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Settings, LogOut, 
  ArrowLeft, Camera, Loader2, PlusCircle, FolderOpen
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 유저 정보 불러오기
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // 사진 업로드 로직 (기존과 동일)
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, compressedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(fileName);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

      alert("프로필 사진이 변경되었습니다! ✨");
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("업로드 실패");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      await supabase.auth.signOut();
      navigate('/');
    }
  };

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="w-64 h-screen bg-[#1a1c23] text-gray-400 flex flex-col border-r border-gray-800 flex-shrink-0 transition-all duration-300">
      
      {/* 1. 상단 로고 영역 */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold tracking-widest text-sm">TRAVEL HOME</span>
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4 tracking-tighter">
          DEPARTURE<span className="text-blue-500">.</span>
        </h1>
      </div>

      {/* 2. 메뉴 리스트 */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        
        <p className="text-xs font-bold text-gray-600 px-4 mb-2 mt-4">MAIN MENU</p>
        
        {/* 활성화된 메뉴 (일보 관리) */}
        <Link 
          to="/report" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            location.pathname.startsWith('/report') 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
            : 'hover:bg-gray-800 hover:text-gray-200'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="font-medium text-sm">일보 대시보드</span>
        </Link>

        {/* 🚀 미래를 위한 메뉴들 (준비중) */}
        <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 hover:text-gray-200 cursor-not-allowed opacity-50">
          <FileText size={20} />
          <span className="font-medium text-sm">견적서 관리</span>
          <span className="text-[10px] border border-gray-600 px-1 rounded ml-auto">Soon</span>
        </div>
        
        <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 hover:text-gray-200 cursor-not-allowed opacity-50">
          <FolderOpen size={20} />
          <span className="font-medium text-sm">현장 문서함</span>
        </div>

      </nav>

      {/* 3. 하단 프로필 (액자 기능 통합) */}
      <div className="p-4 border-t border-gray-800">
        
        {user ? (
          <div className="bg-gray-800/50 rounded-2xl p-4">
            
            {/* ✨ 여기가 바로 그 '사진 액자' 입니다 */}
            <div 
              className="w-full aspect-[4/3] bg-gray-700 rounded-lg mb-3 overflow-hidden relative group cursor-pointer border border-gray-600"
              onClick={() => !isUploading && fileInputRef.current.click()}
              title="클릭하여 사진 변경"
            >
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="animate-spin text-white" />
                </div>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <Camera size={24} className="mb-1" />
                  <span className="text-[10px]">사진 등록</span>
                </div>
              )}
              
              {/* 호버 시 카메라 아이콘 */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={20} />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="overflow-hidden">
                <p className="text-white text-sm font-bold truncate">{user.email.split('@')[0]}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                <LogOut size={16} />
              </button>
            </div>
            
            {/* 파일 입력창 (숨김) */}
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>
        ) : (
          /* 로그인 안 했을 때 */
          <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
            <p className="text-gray-400 text-sm mb-3">로그인이 필요합니다</p>
            <Link to="/auth/login" className="block w-full bg-blue-600 text-white text-sm py-2 rounded-lg font-bold hover:bg-blue-500">
              로그인 하기
            </Link>
          </div>
        )}
      </div>

    </div>
  );
};

export default Sidebar;