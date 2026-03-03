import React from 'react';
import { TrendingUp, BarChart2, ChevronDown } from 'lucide-react';

const GraphCard = ({ graphMode, setGraphMode, graphYear, setGraphYear, availableYears, trendData, totalCount, maxCount }) => {
  const handleToggle = () => {
    if (graphMode === 'total') setGraphMode('6m');
    else if (graphMode === '6m') setGraphMode('12m');
    else setGraphMode('total');
  };

  const getHeaderInfo = () => {
    switch (graphMode) {
      case '6m': return { title: '최근 6개월 추이', icon: <TrendingUp size={14} /> };
      case '12m': return { title: `${graphYear}년 월별 추이`, icon: <BarChart2 size={14} /> };
      default: return { title: '전체 누적 기록', icon: <TrendingUp size={14} /> };
    }
  };

  const { title, icon } = getHeaderInfo();

  return (
    // 🚨 [Fix] 높이 고정 및 테마 적용
    <div 
      onClick={handleToggle}
      className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-2xl flex flex-col justify-between relative overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors group h-full min-h-[350px]"
    >
      <div className="flex items-center justify-between mb-2 z-10">
        <span className="text-slate-400 text-sm flex items-center gap-1 font-medium">
          {icon} {title}
        </span>
        
        {graphMode === '12m' && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <select 
              value={graphYear}
              onChange={(e) => setGraphYear(Number(e.target.value))}
              className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 pl-3 pr-7 border border-slate-600 rounded-lg text-xs font-bold focus:outline-none transition-colors cursor-pointer"
            >
              {availableYears.map(year => <option key={year} value={year}>{year}년</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2 text-slate-400 pointer-events-none" size={12} />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-end min-h-[160px]">
        {graphMode !== 'total' ? (
          <div className="flex items-end justify-between w-full h-full gap-1 pt-4 animate-in fade-in duration-300">
            {trendData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group/bar">
                
                <div className="w-full relative flex items-end justify-center h-full">
                   <div 
                    style={{ height: `${(item.count / maxCount) * 100}%` }}
                    className={`w-2/3 rounded-t-lg transition-all duration-500 relative overflow-hidden ${item.count > 0 ? 'bg-blue-500/70 group-hover/bar:bg-blue-400 group-hover/bar:shadow-[0_0_15px_rgba(96,165,250,0.6)]' : 'bg-slate-800/50'}`}
                  >
                    {/* 네온 효과를 위한 내부 그라데이션 */}
                    {item.count > 0 && <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>}
                  </div>
                  
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover/bar:opacity-100 group-hover/bar:-translate-y-1 transition-all whitespace-nowrap z-20 pointer-events-none shadow-lg">
                    {item.count}건
                  </div>
                </div>

                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap overflow-hidden group-hover/bar:text-slate-300 transition-colors">
                  {graphMode === '12m' ? item.label.replace('월', '') : item.label}
                </span>

              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-baseline justify-between w-full animate-in fade-in duration-300 h-full pb-4">
            <div className="mt-auto">
               <p className="text-6xl font-extrabold text-white tracking-tighter group-hover:text-blue-400 group-hover:drop-shadow-[0_0_15px_rgba(96,165,250,0.5)] transition-all">
                 {totalCount}
               </p>
               <span className="text-slate-500 text-sm font-medium tracking-widest uppercase mt-2 block">Total Reports</span>
            </div>
            <div className="flex items-end gap-2 opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all mt-auto mb-2">
               <div className="w-2 h-6 bg-blue-500 rounded-t-md shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
               <div className="w-2 h-10 bg-purple-500 rounded-t-md shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
               <div className="w-2 h-4 bg-pink-500 rounded-t-md shadow-[0_0_10px_rgba(236,72,153,0.8)]"></div>
               <div className="w-2 h-14 bg-blue-400 rounded-t-md shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphCard;