// src/components/PlaceCard/PlaceCardExpanded.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import PlaceChatPanel from '../panels/PlaceChatPanel';
import PlaceMediaPanel from '../panels/PlaceMediaPanel';

const PlaceCardExpanded = ({ location, onClose, chatData, galleryData }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const containerRef = useRef(null);

  // Fullscreen Logic
  const toggleFullScreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullScreen(true);
      setShowUI(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black/95 flex p-6 gap-6 animate-fade-in overflow-hidden font-sans">
      
      {/* Global Back Button */}
      <div className={`absolute top-8 left-8 z-[110] transition-opacity ${isFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full text-blue-300 hover:text-white hover:border-blue-500/50 transition-all text-xs font-bold backdrop-blur-md">
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* 🚨 [Refactor] Left Panel: Chat & Info Logic */}
      <PlaceChatPanel 
        location={location}
        chatData={chatData}
        selectedImg={galleryData.selectedImg}
        setSelectedImg={galleryData.setSelectedImg}
        isFullScreen={isFullScreen}
      />

      {/* 🚨 [Refactor] Right Panel: Gallery (Media) Logic */}
      <PlaceMediaPanel 
        galleryData={galleryData}
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
        showUI={showUI}
      />
    </div>
  );
};

export default PlaceCardExpanded;