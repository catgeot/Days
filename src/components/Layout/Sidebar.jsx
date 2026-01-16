import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Settings, LogOut, 
  ArrowLeft, Camera, Loader2, FolderOpen, X, Image as ImageIcon 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // ✨ [화질 개선 핵심 포인트]
      // 1. maxSizeMB: 1MB -> 3MB (용량 넉넉하게)
      // 2. maxWidthOrHeight: 1200px -> 2560px (QHD 모니터 꽉 차는 크기까지 허용)
      const options = { 
        maxSizeMB: 3, 
        maxWidthOrHeight: 2560, 
        useWebWorker: true,
        fileType: 'image/jpeg' // 강제로 JPG로 변환해서 호환성 확보
      };
      
      const compressedFile = await imageCompression(file, options);
      
      const fileExt = 'jpg'; // 위에서 jpeg로 변환했으므로 확장자 고정
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, compressedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(fileName);
      
      // 캐시 문제 방지를 위해 URL 뒤에 시간값 추가 (?t=...)
      const publicUrlWithTime = `${publicUrl}?t=${Date.now()}`;
      
      await supabase.auth.updateUser({ data: { avatar_url: publicUrlWithTime } });

      alert("고화질 추억이 등록되었습니다! ✨");
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
    <>
      <div className="w-64 h-screen bg-[#1a1c23] text-gray-400 flex flex-col border-r border-gray-800 flex-shrink-0 transition-all duration-300">
        
        {/* 상단 로고 */}
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold tracking-widest text-sm">TRAVEL HOME</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4 tracking-tighter">
            DEPARTURE<span className="text-blue-500">.</span>
          </h1>
        </div>

        {/* 메뉴 리스트 */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-bold text-gray-600 px-4 mb-2 mt-4">MAIN MENU</p>
          <Link to="/report" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname.startsWith('/report') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-gray-800 hover:text-gray-200'}`}>
            <LayoutDashboard size={20} /> <span className="font-medium text-sm">일보 대시보드</span>
          </Link>
          <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 hover:text-gray-200 cursor-not-allowed opacity-50">
            <FileText size={20} /> <span className="font-medium text-sm">견적서 관리</span><span className="text-[10px] border border-gray-600 px-1 rounded ml-auto">Soon</span>
          </div>
          <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 hover:text-gray-200 cursor-not-allowed opacity-50">
            <FolderOpen size={20} /> <span className="font-medium text-sm">현장 문서함</span>
          </div>
        </nav>

        {/* 하단 프로필 영역 */}
        <div className="p-4 border-t border-gray-800">
          {user ? (
            <div className="bg-gray-800/50 rounded-2xl p-4">
              
              <div 
                className="w-full aspect-[4/3] bg-gray-700 rounded-lg mb-3 overflow-hidden relative group cursor-pointer border border-gray-600"
                onClick={() => setIsViewing(true)} 
                title="크게 보기"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon size={24} className="mb-1" />
                    <span className="text-[10px]">사진 없음</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">View</span>
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
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
              <p className="text-gray-400 text-sm mb-3">로그인이 필요합니다</p>
              <Link to="/auth/login" className="block w-full bg-blue-600 text-white text-sm py-2 rounded-lg font-bold hover:bg-blue-500">로그인 하기</Link>
            </div>
          )}
        </div>
      </div>

      {/* 포탈: 전체 화면 모달 */}
      {isViewing && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in p-4">
          
          <div className="absolute inset-0" onClick={() => setIsViewing(false)}></div>

          <button 
            onClick={() => setIsViewing(false)}
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-20 bg-black/50 p-2 rounded-full"
          >
            <X size={32} />
          </button>

          <div className="relative flex flex-col items-center justify-center z-10 w-full h-full pointer-events-none">
            
            <div className="relative shadow-2xl rounded-sm overflow-hidden border-[6px] border-white bg-white pointer-events-auto">
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                   <Loader2 size={48} className="animate-spin text-white" />
                </div>
              )}
              
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Big Profile" 
                  className="h-[85vh] w-auto object-contain bg-black min-w-[300px]" 
                />
              ) : (
                <div className="w-[80vw] h-[50vh] flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                  <ImageIcon size={64} />
                  <p className="mt-4 text-lg">등록된 사진이 없습니다.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-4 pointer-events-auto">
              <button 
                onClick={() => fileInputRef.current.click()} 
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full backdrop-blur-md border border-white/20 transition-all font-medium hover:scale-105 active:scale-95"
              >
                <Camera size={20} />
                {avatarUrl ? '다른 사진으로 변경' : '첫 사진 등록하기'}
              </button>
            </div>

          </div>
          
          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

        </div>,
        document.body
      )}
    </>
  );
};

export default Sidebar;