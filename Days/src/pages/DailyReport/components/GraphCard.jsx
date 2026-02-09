import React from 'react';
import { TrendingUp, BarChart2, ChevronDown } from 'lucide-react';

const GraphCard = ({ 
  graphMode, setGraphMode, 
  graphYear, setGraphYear, 
  availableYears, 
  trendData, 
  totalCount, 
  maxCount 
}) => {

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
    <div 
      onClick={handleToggle}
      className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden cursor-pointer hover:border-blue-400 transition-colors group"
    >
      <div className="flex items-center justify-between mb-2 z-10">
        <span className="text-gray-500 text-sm flex items-center gap-1">
          {icon} {title}
        </span>
        
        {graphMode === '12m' && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <select 
              value={graphYear}
              onChange={(e) => setGraphYear(Number(e.target.value))}
              className="appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 pl-2 pr-6 rounded-lg text-xs font-bold focus:outline-blue-500 cursor-pointer transition-colors"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1.5 text-gray-500 pointer-events-none" size={12} />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-end min-h-[120px]">
        {graphMode !== 'total' ? (
          /* 그래프 모드 (6m or 12m) */
          <div className="flex items-end justify-between w-full h-full gap-1 pt-4 animate-in fade-in duration-300">
            {trendData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1 flex-1 h-full justify-end group/bar">
                
                {/* 막대 영역 Container */}
                <div className="w-full relative flex items-end justify-center h-full">
                   {/* ✨ 실제 막대 (날씬해짐: w-2/3, 둥글게: rounded-t-md) */}
                   <div 
                    style={{ height: `${(item.count / maxCount) * 100}%` }}
                    className={`w-2/3 rounded-t-md transition-all duration-500 ${item.count > 0 ? 'bg-blue-400 group-hover/bar:bg-blue-500' : 'bg-gray-100'}`}
                  ></div>
                  
                  {/* 툴팁 (숫자) */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                    {item.count}건
                  </div>
                </div>

                {/* 라벨 표시 */}
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap overflow-hidden">
                  {graphMode === '12m' ? item.label.replace('월', '') : item.label}
                </span>

              </div>
            ))}
          </div>
        ) : (
          /* 기본 모드: 전체 숫자 */
          <div className="flex items-baseline justify-between w-full animate-in fade-in duration-300">
            <div>
               <p className="text-4xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                 {totalCount}
               </p>
               <span className="text-gray-500 text-sm">Total Reports</span>
            </div>
            {/* 배경 미니바도 같이 날씬하게 */}
            <div className="flex items-end gap-2 opacity-20 grayscale group-hover:grayscale-0 transition-all">
               <div className="w-1.5 h-4 bg-blue-500 rounded-t"></div>
               <div className="w-1.5 h-6 bg-blue-500 rounded-t"></div>
               <div className="w-1.5 h-3 bg-blue-500 rounded-t"></div>
               <div className="w-1.5 h-8 bg-blue-500 rounded-t"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphCard;