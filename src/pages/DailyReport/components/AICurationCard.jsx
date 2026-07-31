import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles, ArrowRight } from 'lucide-react';
import { readCurationData, readCurationHistory } from '../lib/curationHistory';

const AICurationCard = () => {
  const current = readCurationData();
  const historyCount = readCurationHistory().length;

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-sm flex flex-col h-full min-h-[340px] relative overflow-hidden">
      <div className="p-8 flex flex-col items-center justify-center w-full text-center z-10 flex-1">
        <div className="w-14 h-14 bg-blue-50/80 rounded-full flex items-center justify-center mb-5 border border-blue-100">
          <Compass size={24} className="text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">당신만을 위한 큐레이션</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-sm font-light break-keep">
          전용 페이지에서 숨은 낙원·실용 팁·나의 추천 목록을 한곳에서 봅니다.
        </p>
        {current?.location ? (
          <p className="text-xs text-blue-600 font-medium mb-4 break-keep">
            최근 추천 · {current.location}
            {historyCount > 1 ? ` · 목록 ${historyCount}` : ''}
          </p>
        ) : historyCount > 0 ? (
          <p className="text-xs text-gray-400 font-medium mb-4">저장된 추천 {historyCount}곳</p>
        ) : null}
        <Link
          to="/blog/curation"
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Sparkles size={16} /> 큐레이션 페이지 열기
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default AICurationCard;
