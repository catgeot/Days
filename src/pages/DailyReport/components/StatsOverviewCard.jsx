// // src/pages/DailyReport/components/StatsOverviewCard.jsx
// // 🚨 [New] StatsCard + GraphCard 병합형 컴포넌트

// import React from 'react';
// import { Calendar, TrendingUp, CheckCircle2 } from 'lucide-react';

// const StatsOverviewCard = ({ viewYear, setViewYear, viewMonth, setViewMonth, availableYears, count, trendData, maxCount }) => {
//   const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
//   const achievementRate = Math.round((count / daysInMonth) * 100);

//   return (
//     <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-2xl flex flex-col justify-between h-full min-h-[350px] relative overflow-hidden group">
      
//       {/* 상단: 기간 선택 및 달성률 */}
//       <div className="flex items-center justify-between mb-4 z-10">
//         <select 
//           value={viewMonth}
//           onChange={(e) => setViewMonth(Number(e.target.value))}
//           className="appearance-none bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 py-1.5 pl-3 pr-4 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
//         >
//           {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{viewYear}년 {i + 1}월</option>)}
//         </select>
        
//         <span className="text-xs font-bold px-2.5 py-1 bg-blue-900/40 text-blue-300 border border-blue-800/50 rounded-full flex items-center gap-1">
//           <CheckCircle2 size={12} /> {achievementRate}%
//         </span>
//       </div>

//       {/* 중단: 메인 숫자 */}
//       <div className="z-10 mt-2">
//         <p className="text-sm text-slate-400 font-medium mb-1">이번 달 기록</p>
//         <div className="flex items-baseline gap-2">
//           <p className="text-5xl font-extrabold text-white tracking-tight">{count}</p>
//           <span className="text-slate-500 font-medium text-lg">건</span>
//         </div>
//       </div>

//       {/* 하단: 미니멀 트렌드 막대 그래프 (기존 GraphCard 기능 흡수) */}
//       <div className="flex-1 flex items-end justify-between w-full mt-6 gap-1 z-10">
//         {trendData && trendData.slice(-6).map((item, idx) => (
//           <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end group/bar relative">
//             <div className="w-full relative flex items-end justify-center h-20">
//                <div 
//                 style={{ height: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
//                 className={`w-full max-w-[12px] rounded-t-md transition-all duration-500 ${item.count > 0 ? 'bg-blue-500/70 group-hover/bar:bg-blue-400' : 'bg-slate-800'}`}
//               ></div>
//             </div>
//             <span className="text-[9px] text-slate-500 font-medium">{item.label.replace('월', '')}</span>
//           </div>
//         ))}
//       </div>

//       {/* 배경 장식 아이콘 */}
//       <div className="absolute -bottom-4 -right-4 text-slate-800/40 opacity-40 z-0 pointer-events-none transform rotate-12 group-hover:scale-110 transition-all duration-700">
//         <TrendingUp size={120} />
//       </div>
//     </div>
//   );
// };

// export default StatsOverviewCard;