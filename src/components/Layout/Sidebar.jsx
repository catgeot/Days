import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, LogOut, ArrowLeft, Camera, Loader2, FolderOpen, 
  X, Image as ImageIcon, Play, Pause, ChevronLeft, ChevronRight, ExternalLink 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // 상태 관리
  const [isUploading, setIsUploading] = useState(false);
  const [isViewing, setIsViewing] = useState(false); // 뷰어 모드 ON/OFF
  const [slides, setSlides] = useState([]); // 슬라이드 데이터
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(true); // 자동 재생 여부
  const fileInputRef = useRef(null);

  // 1. 유저 정보 & 사진 데이터 가져오기
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 일보(Reports)에서 사진 긁어오기 (최신순 50개)
        const { data: reportData } = await supabase
          .from('reports')
          .select('images')
          .eq('user_id', user.id)
          .not('images', 'is', null)
          .order('date', { ascending: false })
          .limit(20); 

        let collectedImages = [];
        if (reportData) {
          reportData.forEach(item => {
            if (Array.isArray(item.images)) {
              collectedImages.push(...item.images);
            }
          });
        }

        if (collectedImages.length > 0) {
          setSlides(collectedImages.slice(0, 50));
        } else if (user.user_metadata?.avatar_url) {
          setSlides([user.user_metadata.avatar_url]); 
        }
      }
    };
    initData();
  }, []);

  // 2. 자동 재생 로직
  useEffect(() => {
    let interval;
    if (isViewing && isPlaying && slides.length > 1) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      }, 4000); // 4초마다 변경
    }
    return () => clearInterval(interval);
  }, [isViewing, isPlaying, slides]);


  // ✨ [핵심 기능] 이미지를 클릭했을 때: 멈추고 + 새 창 열기
  const handleImageClick = (e) => {
    e.stopPropagation(); // 배경 클릭(닫기) 이벤트 방지
    
    // 1. 일단 멈춤!
    setIsPlaying(false);
    
    // 2. 현재 사진을 새 탭에서 열기
    const currentImageUrl = slides[currentSlideIndex];
    if (currentImageUrl) {
      window.open(currentImageUrl, '_blank');
    }
  };


  // 사진 업로드
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const options = { maxSizeMB: 3, maxWidthOrHeight: 2560, useWebWorker: true, fileType: 'image/jpeg' };
      const compressedFile = await imageCompression(file, options);
      const fileName = `${user.id}_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('profiles').upload(fileName, compressedFile);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(fileName);
      const publicUrlWithTime = `${publicUrl}?t=${Date.now()}`;
      await supabase.auth.updateUser({ data: { avatar_url: publicUrlWithTime } });
      alert("프로필 사진이 업데이트 되었습니다!");
      window.location.reload(); 
    } catch (error) { console.error(error); alert("업로드 실패"); } finally { setIsUploading(false); }
  };

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      await supabase.auth.signOut();
      navigate('/');
    }
  };

  const nextSlide = (e) => { e.stopPropagation(); setCurrentSlideIndex((prev) => (prev + 1) % slides.length); };
  const prevSlide = (e) => { e.stopPropagation(); setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length); };

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <>
      <div className="w-64 h-screen bg-[#1a1c23] text-gray-400 flex flex-col border-r border-gray-800 flex-shrink-0 transition-all duration-300">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold tracking-widest text-sm">TRAVEL HOME</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4 tracking-tighter">DEPARTURE<span className="text-blue-500">.</span></h1>
        </div>

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

        <div className="p-4 border-t border-gray-800">
          {user ? (
            <div className="bg-gray-800/50 rounded-2xl p-4">
              <div 
                className="w-full aspect-[4/3] bg-gray-700 rounded-lg mb-3 overflow-hidden relative group cursor-pointer border border-gray-600"
                onClick={() => setIsViewing(true)} 
                title="추억 액자 열기"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500"><ImageIcon size={24} className="mb-1" /><span className="text-[10px]">사진 없음</span></div>
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">Gallery</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="overflow-hidden"><p className="text-white text-sm font-bold truncate">{user.email.split('@')[0]}</p><p className="text-xs text-gray-500 truncate">{user.email}</p></div>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-gray-700 rounded-lg transition-colors"><LogOut size={16} /></button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-2xl p-4 text-center"><p className="text-gray-400 text-sm mb-3">로그인이 필요합니다</p><Link to="/auth/login" className="block w-full bg-blue-600 text-white text-sm py-2 rounded-lg font-bold hover:bg-blue-500">로그인 하기</Link></div>
          )}
        </div>
      </div>

      {/* ✨ [디지털 액자 모드] */}
      {isViewing && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-fade-in group">
          
          {/* 배경 클릭 시 닫기 */}
          <div className="absolute inset-0" onClick={() => setIsViewing(false)}></div>

          {/* 닫기 버튼 */}
          <button onClick={() => setIsViewing(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-20 bg-black/50 p-2 rounded-full"><X size={32} /></button>

          {/* 메인 슬라이드 영역 */}
          <div className="relative w-full h-full flex items-center justify-center pointer-events-none p-4">
            
            {slides.length > 0 ? (
              <div className="relative pointer-events-auto shadow-2xl group/image">
                {/* 현재 이미지 */}
                <img 
                  src={slides[currentSlideIndex]} 
                  alt="Memory Slide" 
                  onClick={handleImageClick} // ✨ 클릭 이벤트 연결
                  className="max-h-[85vh] max-w-[95vw] w-auto h-auto object-contain transition-opacity duration-500 cursor-pointer"
                  title="클릭하여 새 창에서 열기 (자동 일시정지)"
                />
                
                {/* 이미지 위에 뜨는 '새창열기' 안내 아이콘 (호버 시) */}
                <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none">
                  <ExternalLink size={20} />
                </div>

                {/* 좌우 화살표 */}
                {slides.length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"><ChevronLeft size={32} /></button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"><ChevronRight size={32} /></button>
                  </>
                )}
              </div>
            ) : (
              <div className="text-gray-500 flex flex-col items-center"><ImageIcon size={64} /><p className="mt-4">표시할 사진이 없습니다.</p></div>
            )}

          </div>

          {/* 하단 컨트롤 바 */}
          <div className="absolute bottom-8 z-20 flex items-center gap-6 pointer-events-auto bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 hover:bg-black/60 transition-all">
            
            {/* 재생/일시정지 토글 */}
            {slides.length > 1 && (
              <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-blue-400 transition-colors" title={isPlaying ? "일시정지" : "자동재생 시작"}>
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
            )}

            <span className="text-white/80 font-mono text-sm border-r border-white/20 pr-6 mr-0">
              {currentSlideIndex + 1} / {slides.length || 0}
            </span>

            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold transition-colors">
              <Camera size={16} /> 프로필 변경
            </button>
          </div>
          
          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
        </div>,
        document.body
      )}
    </>
  );
};

export default Sidebar;