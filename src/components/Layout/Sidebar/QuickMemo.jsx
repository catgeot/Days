import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, StickyNote } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // 경로 주의

const QuickMemo = ({ user }) => {
  const [memos, setMemos] = useState(['']);
  const [currentMemoIndex, setCurrentMemoIndex] = useState(0);
  const [isMemoSaved, setIsMemoSaved] = useState(true);

  // 메모 데이터 로드
  useEffect(() => {
    if (!user) return;
    const loadMemos = async () => {
      const { data } = await supabase
				.from('memos')
				.select('memo_list')
				.eq('user_id', user.id)
				.maybeSingle();
      if (data?.memo_list) setMemos(data.memo_list);
    };
    loadMemos();
  }, [user]);

  // 저장 로직 (Debounce 적용)
  const saveToSupabase = useCallback(async (newMemos, userId) => {
    try {
      await supabase.from('memos').upsert({ user_id: userId, memo_list: newMemos, updated_at: new Date() });
      setIsMemoSaved(true);
    } catch (e) { console.error(e); setIsMemoSaved(false); }
  }, []);

  // Debounce Wrapper
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      if (!isMemoSaved) saveToSupabase(memos, user.id);
    }, 1000);
    return () => clearTimeout(timer);
  }, [memos, isMemoSaved, user, saveToSupabase]);

  // 핸들러들
  const handleChange = (e) => {
    const newMemos = [...memos];
    newMemos[currentMemoIndex] = e.target.value;
    setMemos(newMemos);
    setIsMemoSaved(false);
  };

  const addMemo = () => {
    const newMemos = [...memos, ''];
    setMemos(newMemos);
    setCurrentMemoIndex(newMemos.length - 1);
    setIsMemoSaved(false);
  };

  const deleteMemo = () => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    const newMemos = memos.filter((_, i) => i !== currentMemoIndex);
    if (newMemos.length === 0) newMemos.push('');
    setMemos(newMemos);
    setCurrentMemoIndex((prev) => (prev >= newMemos.length ? newMemos.length - 1 : prev));
    setIsMemoSaved(false);
  };

  return (
    <nav className="flex-1 px-4 py-2 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col h-full mt-2 relative">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-2 mb-2 select-none">
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 tracking-wider">
            <StickyNote size={12} className="text-blue-400"/> 
            <span>NOTE {currentMemoIndex + 1} <span className="text-gray-700">/</span> {memos.length}</span>
          </div>
          <span className={`text-[10px] font-mono transition-colors ${isMemoSaved ? 'text-gray-600' : 'text-blue-400 animate-pulse'}`}>
            {isMemoSaved ? 'Saved' : 'Saving...'}
          </span>
        </div>

        {/* 본문 */}
        <div className="flex-1 bg-gray-800/40 border border-gray-700/30 rounded-xl p-1 flex flex-col transition-all hover:border-gray-600/50">
          <textarea 
						className="flex-1 w-full bg-transparent border-0 p-3 text-sm text-white/90 placeholder-gray-400 focus:outline-none resize-none custom-scrollbar leading-relaxed font-medium selection:bg-blue-500/30"
						placeholder="새로운 아이디어를 적어보세요..."
						value={memos[currentMemoIndex]}
						onChange={handleChange}
						spellCheck="false"
					/>
          {/* 컨트롤 바 */}
					<div className="h-12 flex items-center justify-between px-3 border-t border-white/10 bg-white/5">
						
						{/* 1. 삭제 버튼: 평소엔 흐리게, 올리면 빨갛게 */}
						<button 
							onClick={deleteMemo} 
							className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
							title="메모 삭제"
						>
							<Trash2 size={16} />
						</button>

						{/* 2. 네비게이션: 아이콘 밝기 UP, 비활성화 상태 명확히 */}
						<div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5">
							<button 
								onClick={() => setCurrentMemoIndex(Math.max(0, currentMemoIndex - 1))} 
								disabled={currentMemoIndex === 0} 
								className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded disabled:text-gray-700 disabled:bg-transparent disabled:cursor-not-allowed transition-all"
							>
								<ChevronLeft size={18} />
							</button>
							
							{/* (선택사항) 현재 페이지 번호 표시 - 필요 없으면 삭제 가능 */}
							<span className="text-[12px] text-gray-500 font-mono px-1 min-w-[20px] text-center">
								{currentMemoIndex + 1}/{memos.length}
							</span>

							<button 
								onClick={() => setCurrentMemoIndex(Math.min(memos.length - 1, currentMemoIndex + 1))} 
								disabled={currentMemoIndex === memos.length - 1} 
								className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded disabled:text-gray-700 disabled:bg-transparent disabled:cursor-not-allowed transition-all"
							>
								<ChevronRight size={18} />
							</button>
						</div>

						{/* 3. 추가 버튼: 파란색으로 항상 강조 */}
						<button 
							onClick={addMemo} 
							className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all shadow-[0_0_10px_rgba(59,130,246,0.2)] hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
							title="새 메모 추가"
						>
							<Plus size={18} />
						</button>

					</div>
        </div>
      </div>
    </nav>
  );
};

export default QuickMemo;