// src/pages/Home/components/HomeUI.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, User, Sparkles, Search, Ticket, MessageSquare, MapPin, Loader2, X, Trash2,
  Palmtree, Mountain, Building2, Plane, Compass, LayoutGrid 
} from 'lucide-react'; 
import { Link } from 'react-router-dom'; 
import TravelTicker from '../../../components/TravelTicker'; 
import Logo from './Logo';

const HomeUI = ({ 
  onSearch, onTickerClick, onTicketClick, externalInput, savedTrips, onTripClick, onTripDelete, onOpenChat, onLogoClick, 
  relatedTags = [], isTagLoading = false, onTagClick,
  selectedCategory, onCategorySelect,
  isTickerExpanded, setIsTickerExpanded,
  onClearScouts
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { if (externalInput) setInputValue(externalInput); }, [externalInput]);
  const handleKeyDown = (e) => { if (e.key === 'Enter' && inputValue.trim() !== '') { onSearch(inputValue); inputRef.current?.blur(); } };
  const handleChange = (e) => { setInputValue(e.target.value); };
  const handleClear = () => { setInputValue(''); inputRef.current?.focus(); };

  const CATEGORIES = [
    { id: 'all', icon: LayoutGrid, label: 'All', color: 'text-gray-400' },
    { id: 'paradise', icon: Palmtree, label: 'Paradise', color: 'text-cyan-400' },
    { id: 'nature', icon: Mountain, label: 'Nature', color: 'text-green-400' },
    { id: 'urban', icon: Building2, label: 'Urban', color: 'text-purple-400' },
    { id: 'nearby', icon: Plane, label: 'Nearby', color: 'text-yellow-400' },
    { id: 'adventure', icon: Compass, label: 'Adventure', color: 'text-red-400' },
  ];

  return (
    <>
      {/* --- Header Area --- */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 grid grid-cols-12 items-start pointer-events-none">
        {/* 1. Logo */}
        <div onClick={onLogoClick} className="col-span-3 flex flex-col justify-center animate-fade-in-down pt-2 pl-2 pointer-events-auto cursor-pointer group">
          <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 group-hover:scale-105 transition-transform origin-left"><Logo /></h1>
          <span className="text-[10px] text-gray-500 tracking-[0.3em] ml-1 group-hover:text-blue-400 transition-colors">DEPARTURE LOUNGE</span>
        </div>

        {/* 2. Omni-box */}
        <div className="col-span-5 flex flex-col items-center animate-fade-in-down delay-100 pt-2 pointer-events-auto relative">
           <div className="relative group w-full max-w-md z-50">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg transition-all h-12 rounded-full group-focus-within:bg-black/60 group-focus-within:border-blue-400/50 hover:bg-black/50">
              <div className="pl-4 text-gray-400 group-focus-within:text-blue-400 transition-colors"><Search size={18} /></div>
              <input ref={inputRef} type="text" value={inputValue} onChange={handleChange} placeholder="어디로 떠나시나요?" className="w-full bg-transparent text-white px-3 text-sm focus:outline-none placeholder-gray-500/80 font-medium" onKeyDown={handleKeyDown} />
              {inputValue && (<button onClick={handleClear} className="p-1 mr-2 text-gray-400 hover:text-white transition-colors"><X size={16} /></button>)}
            </div>
          </div>
        </div>
        
        {/* 3. 🚨 [Moved] Cleaner Button */}
        <div className="col-span-1 flex justify-center pt-3 animate-fade-in-down pointer-events-auto">
           <button 
             onClick={onClearScouts}
             className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all shadow-lg group"
             title="Clear Map Pins"
           >
             <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
           </button>
        </div>

        {/* 4. Ticker */}
        <div className="col-span-3 flex justify-end animate-fade-in-down pr-24 pointer-events-auto">
          <TravelTicker 
            onCityClick={(data) => onTickerClick(data, 'ticker')} 
            isExpanded={isTickerExpanded}
            onToggle={setIsTickerExpanded}
          />
        </div>
      </div>

      {/* --- Middle & Footer (기존 유지) --- */}
      {(isTagLoading || relatedTags.length > 0) && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 pointer-events-auto animate-fade-in-right">
             {/* Tag rendering code ... */}
             {!isTagLoading && relatedTags.map((tag, idx) => (
              <button key={idx} onClick={() => onTagClick(tag)} className="group relative flex items-center justify-between w-40 p-3 bg-black/30 backdrop-blur-md border border-white/5 rounded-xl hover:bg-white/10 hover:border-blue-500/50 hover:w-44 transition-all duration-300 shadow-lg">
                 <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400 group-hover:text-blue-400 transition-colors" /><span className="text-sm text-gray-200 font-medium group-hover:text-white">{tag}</span></div>
              </button>
            ))}
        </div>
      )}

      <div className="absolute right-6 top-6 z-20 flex flex-col gap-4 pointer-events-auto animate-fade-in-left">
         {/* Filter Categories ... */}
         <div className="flex flex-col items-center gap-2 bg-black/30 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
            {CATEGORIES.map((cat) => (
               <button key={cat.id} onClick={() => onCategorySelect(cat.id)} className={`...`}>
                 <cat.icon size={20} className={`transition-colors ${selectedCategory === cat.id ? cat.color : 'text-gray-500'}`} />
               </button>
            ))}
         </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 p-6 z-20 pointer-events-none">
        <div className="absolute bottom-6 left-6 flex items-end gap-4 pointer-events-auto">
          {/* Logbook & Admin Buttons ... */}
          <Link to="/auth/login" className="group flex items-center gap-2 pb-2 cursor-pointer">
             <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-purple-400/50 transition-all shadow-lg"><User size={18} /></div>
             <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">ADMIN</span>
          </Link>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto">
          <button onClick={() => onOpenChat()} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-lg"><MessageSquare size={18} /></button>
          <button onClick={onTicketClick} className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md text-white px-8 py-3 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center gap-2 font-bold text-xs border border-white/10"><Ticket size={16} /> <span>여행 계획 시작하기</span></button>
        </div>
      </footer>
    </>
  );
};
export default HomeUI;