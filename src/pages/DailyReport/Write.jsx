// src/pages/DailyReport/Write.jsx
// ?ö® [Fix/New] ?òÏ†ï ?¥Ïú†: 
// 1. [UX/UI] ?úÏù∏??Í∞úÏÑ†???ÑÌïú 'Î≤àÌò∏ Í∏∞Î∞ò ?®Í≥ÑÎ≥??àÏù¥?ÑÏõÉ' ?ÑÏûÖ ([01]~[03])
// 2. [Affordance] ?ÖÎ†• ?ÅÏó≠??Î™ÖÌôï???åÎëêÎ¶?Border)?Ä ?¨Ïª§???òÏù¥?ºÏù¥??Ï∂îÍ??òÏó¨ ?ÖÎ†• ÏßÄ??Î™ÖÌôï??
// 3. [Contextual AI] AI ?ëÍ? Í∏∞Îä•??Î≥∏Î¨∏ ?ÅÏó≠ Î∞îÎ°ú ?ÑÎ°ú ?ÑÏßÑ Î∞∞Ïπò?òÏó¨ ?ëÍ∑º??Í∞ïÌôî.
// 4. [Copywriting] ÏßàÎ¨∏???åÎ†à?¥Ïä§?Ä?îÎ? ?µÌï¥ ?¨Ïö©?êÏùò ?ëÏÑ± ?òÎèÑ Í∞Ä?¥Îìú.

import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { Save, ArrowLeft, MapPin, Loader2, Image as ImageIcon, X, Sparkles, Undo2, Calendar } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import { useLogbookMedia } from './hooks/useLogbookMedia';
import { useLogbookAI } from './hooks/useLogbookAI';

const Write = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const isEditMode = Boolean(id);

  const getLocalDate = () => {
    const dateParam = searchParams.get('date');
    if (dateParam) return dateParam;
    
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getLocalDate());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mapLocation, setMapLocation] = useState(''); 
  const [uploading, setUploading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiLoadingMsg, setAiLoadingMsg] = useState('');

  const { 
    imageFiles, previewUrls, existingImages, setExistingImages, 
    handleImageChange, removeNewImage, removeExistingImage, heroImageUrl,
    isCompressing, compressProgress 
  } = useLogbookMedia();

  const { 
    isAILoading, backupData, handleAIPolish, handleRestoreBackup 
  } = useLogbookAI(title, setTitle, content, setContent, date, mapLocation);

  useEffect(() => {
    const loadInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (isEditMode && id) {
        if (!user) {
          alert('Î°úÍ∑∏?∏Ïù¥ ?ÑÏöî?©Îãà??');
          navigate('/login', { replace: true });
          return;
        }
        const { data } = await supabase.from('reports').select('*').eq('id', id).eq('user_id', user.id).single();
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setMapLocation(data.location);
          setDate(data.date);
          setExistingImages(data.images || []); 
        } else {
          alert('Ï°¥Ïû¨?òÏ? ?äÎäî Í∏∞Î°ù?ÖÎãà??');
          navigate('/blog', { replace: true });
        }
      }
      
      if (user) {
        const { data: historyData } = await supabase.from('reports').select('location').eq('user_id', user.id).neq('location', null).neq('location', '').order('date', { ascending: false }).limit(20);
        if (historyData) {
          const uniqueLocs = [...new Set(historyData.map(item => item.location))].slice(0, 5);
          setRecentLocations(uniqueLocs);
        }
      }
    };
    loadInitialData();
  }, [id, isEditMode, setExistingImages, navigate]);

  useEffect(() => {
    if (isAILoading) {
      const msgs = ["?ÑÏÑ± ?µÏã†Îß??∞Í≤∞ Ï§?..", "?¨ÏßÑ ??Í∞êÏÑ±???ΩÏñ¥?¥Îäî Ï§?..", "Î¨∏Ïû•??Îß•ÎùΩ??Ï°∞Ïú®?òÎäî Ï§?..", "ÎßàÏ?Îß??¥Í≥†Î•?ÏßÑÌñâ Ï§ëÏûÖ?àÎã§..."];
      let i = 0;
      setAiLoadingMsg(msgs[0]);
      const timer = setInterval(() => {
        i = (i + 1) % msgs.length;
        setAiLoadingMsg(msgs[i]);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isAILoading]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert("?ÑÏπò ?ïÎ≥¥Î•?ÏßÄ?êÌïòÏßÄ ?äÏäµ?àÎã§.");
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          const addr = data.address;
          const displayAddress = [addr.city || addr.province || '', addr.borough || addr.district || '', addr.quarter || addr.neighbourhood || addr.suburb || ''].filter(Boolean).join(' ');
          setMapLocation(displayAddress || "?ÑÏπò ?ïÎ≥¥ ?ÜÏùå");
        } catch (e) { setMapLocation("?ÑÏπò ?ïÏù∏ ?§Ìå®"); } finally { setLocationLoading(false); }
      }, () => { setLocationLoading(false); alert("?ÑÏπò Í∂åÌïú???ïÏù∏?¥Ï£º?∏Ïöî."); }
    );
  };

  const handleSave = async () => {
    if (!title) return alert("?úÎ™©???ÖÎ†•?¥Ï£º?∏Ïöî!");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Î°úÍ∑∏?∏Ïù¥ ?ÑÏöî?©Îãà??");

    setUploading(true);
    let finalImageUrls = [...existingImages];

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { error } = await supabase.storage.from('images').upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        return data.publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      finalImageUrls = [...finalImageUrls, ...newUrls];

      const reportData = { title, content, location: mapLocation || '?ÑÏπò ÎØ∏Ï???, date, images: finalImageUrls, weather: 'ÎßëÏùå', user_id: user.id };

      if (isEditMode) {
        await supabase.from('reports').update(reportData).eq('id', id);
        navigate(`/blog/${id}`);
      } else {
        await supabase.from('reports').insert([reportData]);
        navigate('/blog');
      }
    } catch (error) {
      console.error("?Ä???§Ìå®:", error);
      alert("?Ä??Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 relative font-sans" onClick={() => setShowSuggestions(false)}>
      
      {heroImageUrl && (
        <div className="fixed inset-0 z-0 opacity-10 transition-opacity duration-1000 pointer-events-none">
          <img src={heroImageUrl} alt="Hero Background" className="w-full h-full object-cover blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white"></div>
        </div>
      )}

      {/* ?ö® [Fix] ?§Îçî ?îÏûê??Î≥¥Í∞ï (?úÏù∏?? */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 transition-all p-2.5 bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
              {isEditMode ? 'Í∏∞Î°ù ?òÏ†ï?òÍ∏∞' : '?àÎ°ú???¨Ï†ï Í∏∞Î°ù'}
            </h2>
            <p className="text-[10px] text-blue-500 font-mono uppercase tracking-widest mt-0.5">Logbook Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {backupData && (
            <button onClick={handleRestoreBackup} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100/80 rounded-full border border-gray-200 hover:bg-gray-200 transition-all">
              <Undo2 size={14} /> <span className="hidden sm:inline">?êÎ≥∏ Î≥µÍµ¨</span>
            </button>
          )}
          <button onClick={handleSave} disabled={uploading || isAILoading || isCompressing} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-blue-500/60 active:scale-95 transition-all disabled:opacity-50">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isEditMode ? 'Í∏∞Î°ù ?ÖÎç∞?¥Ìä∏' : 'GATEO???Ä??}</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto pt-10 pb-32 px-4 sm:px-8 flex flex-col gap-12">
        
        {/* ?ö® [01] ?¨Ï†ï ?ïÎ≥¥ ?πÏÖò */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-[10px] font-black text-blue-600">01</span>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">?¨Ï†ï??Í∏∞Î≥∏ ?ïÎ≥¥</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ?†Ïßú ?ÖÎ†•Ï∞??ÖÏ≤¥Í∞?Í∞ïÌôî */}
            <div className="bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all focus-within:border-blue-400 focus-within:bg-blue-50/50">
              <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">
                <Calendar size={12} /> Travel Date
              </label>
              <input type="date" className="w-full bg-transparent outline-none text-xl font-bold text-gray-900 transition-colors" value={date} onChange={(e) => setDate(e.target.value)} disabled={isAILoading || isCompressing} />
            </div>

            {/* ?ÑÏπò ?ÖÎ†•Ï∞??ÖÏ≤¥Í∞?Í∞ïÌôî */}
            <div className="bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all focus-within:border-blue-400 focus-within:bg-blue-50/50 relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <MapPin size={12} /> Location
                </label>
                <button type="button" onClick={handleGetCurrentLocation} disabled={locationLoading} className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                   {locationLoading ? <Loader2 size={10} className="animate-spin" /> : "?ÑÏû¨ ?ÑÏπò Ï∞æÍ∏∞"}
                </button>
              </div>
              <input type="text" className="w-full bg-transparent outline-none text-xl font-bold text-gray-900 placeholder-gray-400 transition-colors" value={mapLocation} onChange={(e) => setMapLocation(e.target.value)} onFocus={() => setShowSuggestions(true)} placeholder="?¥Îîî??Í≥µÍ∏∞Î•??¥ÏïÑ?îÎÇò??" autoComplete="off" disabled={isAILoading || isCompressing} />
              {showSuggestions && recentLocations.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden backdrop-blur-xl">
                   {recentLocations.map((loc, idx) => (<div key={idx} className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-3 transition-all" onClick={() => { setMapLocation(loc); setShowSuggestions(false); }}><MapPin size={14} className="opacity-50" />{loc}</div>))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ?ö® [02] Ï∂îÏñµ(?¨ÏßÑ) ?πÏÖò */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-[10px] font-black text-blue-600">02</span>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">?•Î©¥???¨Ï∞©</h3>
          </div>

          <div className="bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-3xl p-6 sm:p-8 hover:border-gray-300 transition-all relative">
            {isCompressing && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-blue-600 rounded-3xl">
                <Loader2 size={36} className="animate-spin mb-4" />
                <p className="font-bold text-sm">Í∏∞Î°ù???©Îüâ??ÏµúÏ†Å??Ï§?..</p>
                <p className="text-[10px] text-blue-500 mt-2 font-mono">Progress: {compressProgress.current} / {compressProgress.total}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {existingImages.map((url, idx) => ( 
                <div key={`exist-${idx}`} className="relative aspect-square group">
                  <img src={url} className="w-full h-full object-cover rounded-2xl border border-gray-200 group-hover:border-gray-300 transition-all" />
                  <button onClick={() => removeExistingImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md scale-0 group-hover:scale-100 transition-transform"><X size={12} /></button>
                </div> 
              ))}
              {previewUrls.map((url, idx) => ( 
                <div key={`new-${idx}`} className="relative aspect-square group">
                  <img src={url} className="w-full h-full object-cover rounded-2xl border border-blue-300 group-hover:border-blue-400 transition-all" />
                  <button onClick={() => removeNewImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md scale-0 group-hover:scale-100 transition-transform"><X size={12} /></button>
                </div> 
              ))}
              {(existingImages.length + previewUrls.length) < 10 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-all group">
                  <ImageIcon size={28} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-center">Add Moment</span>
                  <input type="file" accept="image/*" multiple onChange={(e) => handleImageChange(e, isAILoading)} className="hidden" disabled={isAILoading || isCompressing} />
                </label>
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-6 text-center font-bold tracking-widest uppercase">Max 10 images / High-Quality Compression Applied</p>
          </div>
        </section>

        {/* ?ö® [03] ?¥ÏïºÍ∏??πÏÖò (Í∞Ä??Ï§ëÏöî) */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-[10px] font-black text-blue-600">03</span>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Í∏∞Î°ù???ÑÏÑ±</h3>
          </div>

          <div className="flex flex-col gap-4">
            {/* ?úÎ™© ?πÏÖò */}
            <div className="bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-3xl p-6 sm:p-8 focus-within:border-blue-400 transition-all">
              <input type="text" className="w-full bg-transparent outline-none text-2xl sm:text-4xl font-black text-gray-900 placeholder-gray-400 tracking-tight" placeholder="?¥Î≤à ?¨Ï†ï????Î¨∏Ïû•?ºÎ°ú ?ïÏùò?úÎã§Î©?" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isAILoading || isCompressing} />
            </div>

            {/* Î≥∏Î¨∏ Î∞?AI ?¥Î∞î ?πÏÖò */}
            <div className="bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-3xl p-6 sm:p-8 focus-within:border-blue-400 transition-all relative min-h-[500px] flex flex-col">
              
              {/* ?ö® [New] Contextual AI Toolbar: Î≥∏Î¨∏ Î∞îÎ°ú ?ÑÏóê???ÑÏ? Î∞õÍ∏∞ */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Storytelling</label>
                <div className="flex gap-2">
                  <button onClick={() => handleAIPolish('essay', imageFiles)} disabled={isAILoading || isCompressing} className="group flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 text-purple-600 rounded-full text-[10px] font-black hover:bg-purple-100 hover:text-purple-700 transition-all">
                    <Sparkles size={12} className="group-hover:animate-spin" /> AI ?êÏÑ∏???ëÍ?
                  </button>
                  <button onClick={() => handleAIPolish('sns', imageFiles)} disabled={isAILoading || isCompressing} className="group flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-200 text-pink-600 rounded-full text-[10px] font-black hover:bg-pink-100 hover:text-pink-700 transition-all">
                    <Sparkles size={12} className="group-hover:animate-pulse" /> AI SNS ?∏ÌîåÎ£®Ïñ∏??
                  </button>
                </div>
              </div>

              {isAILoading && (
                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center text-purple-600 rounded-3xl">
                  <Loader2 size={40} className="animate-spin mb-6" />
                  <p className="font-black text-sm animate-pulse text-center px-8 tracking-tight">{aiLoadingMsg}</p>
                </div>
              )}

              <textarea 
                className="w-full bg-transparent border-none resize-none outline-none text-lg leading-[2] text-gray-800 placeholder-gray-400 flex-1 min-h-[400px]" 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                disabled={isAILoading || isCompressing} 
                placeholder="?†Ïò§Î•¥Îäî ?åÌé∏?îÎêú Í∏∞Ïñµ?§ÏùÑ ?êÏú†Î°?≤å ?ÅÏñ¥Î≥¥ÏÑ∏?? ?¨ÏßÑ???¨Î¶¨Í≥??ÑÏ™Ω??AI Î≤ÑÌäº???ÑÎ•¥Î©??¨Î∞ï??Î©îÎ™®Í∞Ä ?ÑÎ¶Ñ?§Ïö¥ Í∏∞Î°ù?ºÎ°ú Î≥Ä?©Îãà??" 
              />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Write;
