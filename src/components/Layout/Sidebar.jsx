import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, Camera, X, Image as ImageIcon, 
  ChevronLeft, ChevronRight, Globe, Plus, Trash2 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';

const Sidebar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // --- 상태 관리 ---
  const [isUploading, setIsUploading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(true); 
  
  // ✨ [메모장 상태 변경] 문자열 하나가 아니라 '배열'로 관리
  // 초기값: 저장된게 없으면 빈 메모 1장(['']) 시작
  const [memos, setMemos] = useState(() => {
    const saved = localStorage.getItem('post_it_memos');
    return saved ? JSON.parse(saved) : [''];
  });
  const [currentMemoIndex, setCurrentMemoIndex] = useState(0);
  const [isMemoSaved, setIsMemoSaved] = useState(true);
  
  const fileInputRef = useRef(null);

  // 1. 데이터 로드
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
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
      }, 4000); 
    }
    return () => clearInterval(interval);
  }, [isViewing, isPlaying, slides]);


  // ✨ [메모장 로직] ---------------------------------------------

  // 내용 변경 시
  const handleMemoChange = (e) => {
    const text = e.target.value;
    const newMemos = [...memos];
    newMemos[currentMemoIndex] = text;
    
    setMemos(newMemos);
    setIsMemoSaved(false);
    
    // 배열 전체를 JSON으로 저장
    localStorage.setItem('post_it_memos', JSON.stringify(newMemos));
    setTimeout(() => setIsMemoSaved(true), 800);
  };

  // 새 메모 추가 (+)
  const addNewMemo = () => {
    const newMemos = [...memos, '']; // 빈 메모 추가
    setMemos(newMemos);
    setCurrentMemoIndex(newMemos.length - 1); // 마지막 장으로 이동
    localStorage.setItem('post_it_memos', JSON.stringify(newMemos));
  };

  // 현재 메모 삭제 (휴지통)
  const deleteMemo = () => {
    if (window.confirm('이 메모를 삭제하시겠습니까?')) {
      const newMemos = memos.filter((_, index) => index !== currentMemoIndex);
      
      // 다 지워도 최소 1장은 남겨야 함
      if (newMemos.length === 0) {
        newMemos.push('');
      }

      setMemos(newMemos);
      // 인덱스 조정 (마지막 장을 지웠으면 앞장으로, 아니면 그대로)
      const nextIndex = currentMemoIndex >= newMemos.length ? newMemos.length - 1 : currentMemoIndex;
      setCurrentMemoIndex(nextIndex);
      
      localStorage.setItem('post_it_memos', JSON.stringify(newMemos));
    }
  };

  // 이전/다음 이동
  const prevMemo = () => {
    if (currentMemoIndex > 0) setCurrentMemoIndex(currentMemoIndex - 1);
  };
  const nextMemo = () => {
    if (currentMemoIndex < memos.length - 1) setCurrentMemoIndex(currentMemoIndex + 1);
  };

  // -----------------------------------------------------------


  // 토글 기능
  const togglePlay = (e) => {
    e.stopPropagation();
    if (!isPlaying) {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }
    setIsPlaying(!isPlaying);
  };

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
        
        {/* 상단: 심플한 홈 버튼 (지구본) */}
        <div className="px-6 pt-5 pb-0 flex justify-between items-center">
          <Link 
            to="/" 
            className="text-gray-500 hover:text-blue-400 transition-colors p-2 -ml-2 hover:bg-gray-800/50 rounded-full group" 
            title="Go Home"
          >
            <Globe size={20} className="group-hover:rotate-180 transition-transform duration-700 ease-in-out"/>
          </Link>
        </div>

        {/* 메인 영역: 포스트잇 메모장 */}
        <nav className="flex-1 px-4 py-2 flex flex-col overflow-hidden">
          
          <div className="flex-1 flex flex-col h-full mt-2 relative">
            
            {/* 메모 헤더 (페이지 번호 및 저장 상태) */}
            <div className="flex items-center justify-between px-2 mb-2 select-none">
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 tracking-wider">
                    <span className="text-blue-400">NOTE</span> {currentMemoIndex + 1} <span className="text-gray-700">/</span> {memos.length}
                </div>
                <span className={`text-[10px] font-mono transition-colors ${isMemoSaved ? 'text-gray-600' : 'text-blue-400 animate-pulse'}`}>
                    {isMemoSaved ? 'Saved' : 'Saving...'}
                </span>
            </div>

            {/* 메모장 본문 (카드 형태) */}
            <div className="flex-1 bg-gray-800/40 border border-gray-700/30 rounded-xl p-1 flex flex-col transition-all hover:border-gray-600/50">
                <textarea 
                    className="flex-1 w-full bg-transparent border-0 p-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                    placeholder="새로운 아이디어를 적어보세요..."
                    value={memos[currentMemoIndex]}
                    onChange={handleMemoChange}
                    spellCheck="false"
                />
                
                {/* 하단 컨트롤 바 (페이지 넘김, 삭제, 추가) */}
                <div className="h-10 flex items-center justify-between px-2 border-t border-gray-700/30">
                    
                    {/* 왼쪽: 삭제 버튼 */}
                    <button 
                        onClick={deleteMemo}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-md hover:bg-red-400/10"
                        title="Delete this note"
                    >
                        <Trash2 size={14} />
                    </button>

                    {/* 중앙: 네비게이션 */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={prevMemo} 
                            disabled={currentMemoIndex === 0}
                            className={`p-1 transition-colors ${currentMemoIndex === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            onClick={nextMemo} 
                            disabled={currentMemoIndex === memos.length - 1}
                            className={`p-1 transition-colors ${currentMemoIndex === memos.length - 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* 오른쪽: 추가 버튼 */}
                    <button 
                        onClick={addNewMemo}
                        className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors rounded-md hover:bg-blue-400/10"
                        title="Add new note"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

          </div>
        </nav>

        {/* 하단 프로필 영역 (유지) */}
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

      {/* 슬라이드 뷰어 모달 (유지) */}
      {isViewing && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-fade-in group">
          <div className="absolute inset-0" onClick={() => setIsViewing(false)}></div>
          <button onClick={() => setIsViewing(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-20 bg-black/50 p-2 rounded-full"><X size={32} /></button>

          <div className="relative w-full h-full flex items-center justify-center pointer-events-none p-4">
            {slides.length > 0 ? (
              <div className="relative pointer-events-auto shadow-2xl group/image max-h-[85vh] max-w-[95vw] flex items-center justify-center">
                <img 
                  src={slides[currentSlideIndex]} 
                  alt="Memory Slide" 
                  className="max-h-[85vh] max-w-[95vw] w-auto h-auto object-contain transition-opacity duration-500 select-none"
                />
                <div 
                  className="absolute inset-0 z-0 cursor-pointer"
                  onClick={togglePlay}
                  title={isPlaying ? "클릭하여 일시정지" : "클릭하여 재생"} 
                />
                {slides.length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm opacity-0 group-hover/image:opacity-100 transition-all z-10"><ChevronLeft size={32} /></button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm opacity-0 group-hover/image:opacity-100 transition-all z-10"><ChevronRight size={32} /></button>
                  </>
                )}
              </div>
            ) : (
              <div className="text-gray-500 flex flex-col items-center"><ImageIcon size={64} /><p className="mt-4">표시할 사진이 없습니다.</p></div>
            )}
          </div>

          <div className="absolute bottom-8 z-20 flex items-center gap-6 pointer-events-auto bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 hover:bg-black/60 transition-all">
            <span className="text-white/80 font-mono text-sm border-r border-white/20 pr-6 mr-0">
              {currentSlideIndex + 1} / {slides.length || 0}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                {isPlaying ? "Playing" : "Paused"}
            </span>
            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold transition-colors ml-4">
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