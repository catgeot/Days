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
            className="flex-1 w-full bg-transparent border-0 p-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none resize-none custom-scrollbar leading-relaxed"
            placeholder="새로운 아이디어를 적어보세요..."
            value={memos[currentMemoIndex]}
            onChange={handleChange}
            spellCheck="false"
          />
          {/* 컨트롤 바 */}
          <div className="h-10 flex items-center justify-between px-2 border-t border-gray-700/30">
            <button onClick={deleteMemo} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-md hover:bg-red-400/10"><Trash2 size={14} /></button>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentMemoIndex(Math.max(0, currentMemoIndex - 1))} disabled={currentMemoIndex === 0} className="p-1 text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
              <button onClick={() => setCurrentMemoIndex(Math.min(memos.length - 1, currentMemoIndex + 1))} disabled={currentMemoIndex === memos.length - 1} className="p-1 text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
            </div>
            <button onClick={addMemo} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors rounded-md hover:bg-blue-400/10"><Plus size={16} /></button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default QuickMemo;