import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, StickyNote } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';

const QuickMemo = ({ user }) => {
  const [memos, setMemos] = useState(['']);
  const [currentMemoIndex, setCurrentMemoIndex] = useState(0);
  const [isMemoSaved, setIsMemoSaved] = useState(true);

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

  const saveToSupabase = useCallback(async (newMemos, userId) => {
    try {
      await supabase.from('memos').upsert({ user_id: userId, memo_list: newMemos, updated_at: new Date() });
      setIsMemoSaved(true);
    } catch (e) { console.error(e); setIsMemoSaved(false); }
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      if (!isMemoSaved) saveToSupabase(memos, user.id);
    }, 1000);
    return () => clearTimeout(timer);
  }, [memos, isMemoSaved, user, saveToSupabase]);

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
        
        <div className="flex items-center justify-between px-2 mb-2 select-none">
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 tracking-wider">
            <StickyNote size={12} className="text-blue-400"/> 
            <span>NOTE {currentMemoIndex + 1} <span className="text-gray-700">/</span> {memos.length}</span>
          </div>
          <span className={`text-[10px] font-mono transition-colors ${isMemoSaved ? 'text-gray-600' : 'text-blue-400 animate-pulse'}`}>
            {isMemoSaved ? 'Saved' : 'Saving...'}
          </span>
        </div>

        <div className="flex-1 bg-gray-100 border border-gray-200 rounded-xl p-1 flex flex-col transition-all hover:border-blue-400">
          <textarea 
            className="flex-1 w-full bg-transparent border-0 p-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-none resize-none custom-scrollbar leading-relaxed font-medium selection:bg-blue-500/30"
            placeholder="새로운 아이디어를 적어보세요..."
            value={memos[currentMemoIndex]}
            onChange={handleChange}
            spellCheck="false"
          />
          <div className="h-12 flex items-center justify-between px-3 border-t border-gray-200 bg-white/5">
            
            <button 
              onClick={deleteMemo} 
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              title="메모 삭제"
            >
              <Trash2 size={16} />
            </button>

            <div className="flex items-center gap-1 bg-gray-200/50 rounded-lg p-0.5">
              <button 
                onClick={() => setCurrentMemoIndex(Math.max(0, currentMemoIndex - 1))} 
                disabled={currentMemoIndex === 0} 
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-300/50 rounded disabled:text-gray-400 disabled:bg-transparent disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              
              <span className="text-[12px] text-gray-500 font-mono px-1 min-w-[20px] text-center">
                {currentMemoIndex + 1}/{memos.length}
              </span>

              <button 
                onClick={() => setCurrentMemoIndex(Math.min(memos.length - 1, currentMemoIndex + 1))} 
                disabled={currentMemoIndex === memos.length - 1} 
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-300/50 rounded disabled:text-gray-400 disabled:bg-transparent disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>

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