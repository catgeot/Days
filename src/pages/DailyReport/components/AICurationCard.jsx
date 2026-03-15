// src/pages/DailyReport/components/AICurationCard.jsx
// ?š¨ [Fix/New] ?˜ì • ?´ìœ : 
// 1. [Subtraction] onSelectPlace ë°?handlePlaceClick ??ëª¨ë“  ?¼ìš°??ë¡œì§ ?„ì „ ?? œ.
// 2. [UI] ?´ë?ì§€?€ ?œëª©??cursor-pointer, ?•ë? ?„ì´ì½???ë§í¬ë¥??”ì‹œ?˜ëŠ” ?”ì†Œ ?œê±°. ?•ì  ë§¤ê±°ì§?UI.
// 3. [Fix/Subtraction] ì§ì ‘?ì¸ DB Insert êµ¬ë¬¸ ?? œ. useTravelData??saveCurationDataë¥?ì£¼ì…ë°›ì•„ ?¨ì¼ ?Œì´?„ë¼???ìš©.
// 4. [New/UI] ì§€ëª??œê¸° ???œêµ­??ì§€ëª?location) ?˜ë‹¨???ë¬¸ ê³ ìœ  ì§€ëª?locationEn)??ë³‘ê¸°?˜ì—¬ ??ê²€?????•í™•???¥ìƒ.
// 5. ?š¨ [New/Sync] useTravelData?ì„œ savedTripsë¥?ê°€?¸ì? ?Œë”ë§??œì ??ì§„ì‹¤??ê³µê¸‰??DB/Hook ?íƒœ)ê³?UI(?€??ë²„íŠ¼ ë§ˆí¬)ë¥?ì¦‰ì‹œ ?™ê¸°?”í•˜??ë¡œì§ ì¶”ê?.

import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Loader2, Compass, ArrowRight, Bookmark, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { useCurationAI } from '../hooks/useLogbookAI'; 
import { useTravelData } from '../../Home/hooks/useTravelData'; 

const FALLBACK_DATA = {
  title: "?œí‰?‘ì˜ ?œìˆ˜???¨ê²°",
  location: "?„ì´?¬í???, 
  locationEn: "Aitutaki, Cook Islands", 
  description: "?„ì§ ?€ì¤‘ì˜ ë°œê¸¸???¿ì? ?Šì? ?œìˆ˜???™ì›?…ë‹ˆ?? ë»”í•œ ?´ì–‘ì§€??ì§€ì¹˜ì…¨?¤ë©´, ?ë©”?„ë“œë¹??¼êµ°ê³??„ë²½??ë°¤í•˜?˜ì˜ ?€?˜ìˆ˜ê°€ ê¸°ë‹¤ë¦¬ëŠ” ?´ê³³?¼ë¡œ ? ë‚˜ë³´ì„¸?? ?¹ì‹ ???í˜¼???„ë²½???˜ê¸°??ì¤?ê²ƒì…?ˆë‹¤.",
  imageUrl: "https://images.unsplash.com/photo-1596525166299-d1fc30777bf4?q=80&w=800&auto=format&fit=crop",
  searchKeyword: "Aitutaki tropical island pristine beach clear water landscape"
};

const AICurationCard = () => {
  const { status, setStatus, curationData, generateCuration } = useCurationAI();
  
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);
  
  // ?š¨ [Fix] savedTrips ?íƒœë¥?ì¶”ì¶œ?˜ì—¬ ?™ê¸°?”ì˜ ê¸°ì??¼ë¡œ ?¼ìŒ
  const { saveCurationData, savedTrips } = useTravelData(user);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loadingText, setLoadingText] = useState("?°ì£¼??ê¶¤ì ??ë¶„ì„ ì¤?..");
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  // ?š¨ [New/Sync] ?íƒœ ê²€ì¦?(Fact Check): ê²°ê³¼ê°€ ?Œë”ë§ë  ?Œë§ˆ??DB(savedTrips)??ì¡´ì¬?˜ëŠ”ì§€ ?œê? ì§€ëª?ê¸°ì??¼ë¡œ ê²€??
  useEffect(() => {
    if (status === 'result' && curationData) {
      const isAlreadySaved = savedTrips.some(
        trip => trip.destination === curationData.location && trip.is_bookmarked && !trip.is_hidden
      );
      setIsSaved(isAlreadySaved);
    }
  }, [status, curationData, savedTrips]);

  useEffect(() => {
    if (status !== 'loading') return;
    const texts = [
      "?¬ìš©?ì˜ ê¸°ì–µ???¤ìº”?˜ëŠ” ì¤?..",
      "ì·¨í–¥??ë³„ìë¦¬ë? ?°ê²°?˜ëŠ” ì¤?..",
      "?„ë²½???™ì›??ì¢Œí‘œë¥??˜ì‹  ì¤?..",
      "ê°€???œìˆ˜???ê²½???Œë”ë§?ì¤?.."
    ];
    let i = 0;
    const timer = setInterval(() => {
      setLoadingText(texts[i % texts.length]);
      i++;
    }, 2000);
    return () => clearInterval(timer);
  }, [status]);

  const handleCuration = async () => {
    setIsSaved(false);
    setIsTextExpanded(false); 
    
    if (!user) {
      alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
      return;
    }

    const [reportsRes, savedRes] = await Promise.all([
      supabase.from('reports').select('location').eq('user_id', user.id).eq('is_deleted', false).limit(10),
      supabase.from('saved_trips').select('destination').eq('user_id', user.id).eq('is_bookmarked', true).eq('is_hidden', false).limit(10)
    ]);

    await generateCuration(user, reportsRes.data || [], savedRes.data || [], FALLBACK_DATA);
  };

  const handleSaveCuration = async (e) => {
    e.stopPropagation();
    if (isSaving || isSaved || !curationData) return;
    setIsSaving(true);

    try {
      if (!user) {
        alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
        return;
      }
      
      const savedTrip = await saveCurationData(curationData, user);
      if (savedTrip) {
        setIsSaved(true);
      }
    } catch (error) {
      console.error("?€???¤íŒ¨:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row h-full min-h-[340px] relative overflow-hidden group">
      
      {status === 'idle' && (
        <div className="p-8 flex flex-col items-center justify-center w-full text-center z-10">
          <div className="w-14 h-14 bg-blue-50/80 rounded-full flex items-center justify-center mb-5 border border-blue-100">
            <Compass size={24} className="text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">?¹ì‹ ë§Œì„ ?„í•œ ?ë ˆ?´ì…˜</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm font-light">
            ì§€ê¸ˆê¹Œì§€??ê¸°ë¡??ë¶„ì„?˜ì—¬, ?„ì§ ë°œê²¬?˜ì? ëª»í•œ ?„ë²½???¨ê²¨ì§??™ì›??ì°¾ì•„?…ë‹ˆ??
          </p>
          <button 
            onClick={handleCuration}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Sparkles size={16} /> ?™ì› ?ìƒ‰ ?œì‘
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="p-8 flex flex-col items-center justify-center w-full text-center z-10">
          <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1 animate-pulse">{loadingText}</h3>
          <p className="text-xs text-gray-500">?¹ì‹ ??ì·¨í–¥ê³?ê³µëª…?˜ëŠ” ë³„ì„ ì°¾ê³  ?ˆìŠµ?ˆë‹¤.</p>
        </div>
      )}

      {status === 'result' && curationData && (
        <div className="flex flex-col md:flex-row w-full h-full animate-in fade-in zoom-in-95 duration-700">
          
          <div className="w-full md:w-5/12 h-52 md:h-full relative overflow-hidden">
            <img 
              src={curationData.imageUrl} 
              alt={curationData.location} 
              onError={(e) => { e.target.src = FALLBACK_DATA.imageUrl; }}
              className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" 
            />
          </div>

          <div className="w-full md:w-7/12 py-4 pr-4 pl-6 md:py-5 md:pr-5 md:pl-8 flex flex-col relative z-10">
            
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold rounded tracking-wider flex-shrink-0 mt-0.5">
                  <Sparkles size={10} /> AI CURATION
                </span>
                
                <div className="flex flex-col justify-center ml-1">
                  <p className="flex items-center gap-1 text-gray-800 text-sm font-bold truncate max-w-[180px]">
                    <MapPin size={12} className="flex-shrink-0 text-blue-500" /> 
                    <span className="truncate">{curationData.location}</span>
                  </p>
                  <p className="text-gray-500 text-[15px] ml-4 font-mono truncate max-w-[180px] mt-0.5 select-all" title="?´ë¦­?˜ì—¬ ë³µì‚¬?˜ê¸° ?½ìŠµ?ˆë‹¤">
                    {curationData.locationEn}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleSaveCuration}
                className={`p-2.5 rounded-full transition-all flex-shrink-0 z-20 border shadow-sm ${isSaved ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20' : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 border-gray-200'}`}
                title={isSaved ? "?€?¥ë¨" : "?„ì‹œë¦¬ìŠ¤?¸ì— ?€??}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : isSaved ? <Check size={16} /> : <Bookmark size={16} />}
              </button>
            </div>
            
            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-3 tracking-tight line-clamp-2 mt-1">
              {curationData.title}
            </h2>
            
            <div className="mb-6 flex-1">
              <p className={`text-sm text-gray-600 leading-relaxed font-light transition-all duration-300 break-keep ${isTextExpanded ? '' : 'line-clamp-3'}`}>
                {curationData.description}
              </p>
              {curationData.description.length > 80 && (
                <button 
                  onClick={() => setIsTextExpanded(!isTextExpanded)}
                  className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors z-20 relative"
                >
                  {isTextExpanded ? (
                    <><ChevronUp size={14} /> ê°„ëµ??ë³´ê¸°</>
                  ) : (
                    <><ChevronDown size={14} /> ?ì„¸??ë³´ê¸°</>
                  )}
                </button>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs text-gray-400 font-mono tracking-wide uppercase">Gateo Intelligence v5.0</span>
              <button 
                onClick={handleCuration}
                className="group/btn flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-500 transition-colors z-20 relative"
              >
                <Sparkles size={14} className="text-blue-500 group-hover/btn:animate-pulse" />
                ?¤ë¥¸ ?™ì› ?ìƒ‰
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AICurationCard;
