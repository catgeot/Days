// src/pages/Home/components/HomeGlobe.jsx
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { getMarkerDesign } from './markers'; 

const HomeGlobe = forwardRef(({ 
  onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [], 
  tempPinsData = [], 
  travelSpots = [],
  activePinId 
}, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  const [ripples, setRipples] = useState([]);

  // 🔒 호버 락(Hover Lock) 변수
  const isHoveringMarker = useRef(false);

  useImperativeHandle(ref, () => ({
    pauseRotation: () => { 
      if(globeEl.current) globeEl.current.controls().autoRotate = false; 
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    },
    resumeRotation: () => { if(globeEl.current) globeEl.current.controls().autoRotate = true; },
    
    flyToAndPin: (lat, lng, name, category) => {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
      if (globeEl.current) {
        globeEl.current.controls().autoRotate = false; 
        globeEl.current.pointOfView({ lat, lng, altitude: 2.0 }, 1000);
      }
      
      const newRipple = { lat, lng, maxR: 8, propagationSpeed: 3, repeatPeriod: 800 };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => setRipples(prev => prev.filter(r => r !== newRipple)), 2000);

      rotationTimer.current = setTimeout(() => { if (globeEl.current) globeEl.current.controls().autoRotate = true; }, 3000);
    },
    updateLastPinName: () => {}, 
    resetPins: () => {}, 
  }));

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); };
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ altitude: 2.5 }); 
    }
  }, []);

  const handleGlobeClickInternal = ({ lat, lng }) => {
    if (isHoveringMarker.current) return; 
    if (onGlobeClick) onGlobeClick({ lat, lng });
  };

  // 🛡 [Protected Logic] 3단계 계급 + 대화 수명 제한
  const allMarkers = useMemo(() => {
    let result = [];
    const threshold = 0.05; 

    const findMatchIndex = (lat, lng) => 
        result.findIndex(m => Math.abs(m.lat - lat) < threshold && Math.abs(m.lng - lng) < threshold);

    // 1. Level 1: Major Spots
    travelSpots.forEach(spot => {
        result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false });
    });

    // 2. Level 2: Saved Trips (Bookmarks & Recent Chats)
    let chatCount = 0; 

    savedTrips.forEach(trip => {
        const isBookmarked = trip.is_bookmarked;

        // 필터링: 북마크는 무조건 통과, 단순 채팅은 5개까지만
        if (!isBookmarked) {
            if (chatCount >= 5) return; 
            chatCount++;
        }

        const idx = findMatchIndex(trip.lat, trip.lng);
        const fixedName = trip.name || trip.destination || "Saved Place";
        
        if (idx !== -1) {
            // 지명과 겹침 -> 배지 추가
            if (isBookmarked) result[idx].isBookmarked = true;
            else result[idx].hasChat = true;
            result[idx].id = trip.id; 
        } else {
            // 안 겹침 -> 독립 라벨 생성
            // 🚨 [Logic Update] 유저가 찾은 곳은 북마크 여부와 상관없이 무조건 'temp-base'(잔상 디자인) 유지
            result.push({ 
                ...trip, 
                name: fixedName,
                type: 'temp-base', // 👈 여기가 핵심 변경점! (saved-base 대신 무조건 temp-base)
                priority: isBookmarked ? 4 : 3, // 우선순위는 유지 (북마크가 더 높음)
                isBookmarked: isBookmarked,
                hasChat: !isBookmarked
            });
        }
    });

    // 3. Level 3: Temp Pins
    const activePin = tempPinsData.find(p => p.id === activePinId);
    tempPinsData.forEach(pin => {
        const isActive = (pin.id === activePinId);
        if (!isActive && activePin) {
             if (Math.abs(pin.lat - activePin.lat) < threshold && Math.abs(pin.lng - activePin.lng) < threshold) return; 
        }

        const idx = findMatchIndex(pin.lat, pin.lng);
        if (idx !== -1) {
            if (isActive) { result[idx].isActive = true; result[idx].isGhost = false; }
            else { result[idx].isGhost = true; }
        } else {
            result.push({ 
                ...pin, 
                type: 'temp-base', // 밋밋한 베이스
                name: pin.name || "Searching...",
                isActive: isActive,
                isGhost: !isActive 
            });
        }
    });
    return result;
  }, [travelSpots, savedTrips, tempPinsData, activePinId]);

  // 🛡 [Protected Renderer] 디자인 위임
  const renderElement = (d) => {
    const el = document.createElement('div');
    el.style.position = 'absolute'; el.style.pointerEvents = 'auto';

    const { html, zIndex, offsetY } = getMarkerDesign(d);

    el.innerHTML = html;
    el.style.zIndex = zIndex;

    el.onclick = (e) => { 
      e.stopPropagation(); 
      if (onMarkerClick) onMarkerClick(d, 'globe'); 
    };
    
    el.onmouseenter = () => { 
      isHoveringMarker.current = true;
      el.querySelector('div').style.transform = `translate(-50%, ${offsetY}) scale(1.5)`; 
    };
    el.onmouseleave = () => { 
      isHoveringMarker.current = false;
      el.querySelector('div').style.transform = `translate(-50%, ${offsetY}) scale(1)`; 
    };

    return el;
  };

  return (
    <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isChatOpen ? 'opacity-30' : 'opacity-100'}`}>
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#7caeea"
        atmosphereAltitude={0.15}
        onGlobeClick={handleGlobeClickInternal}
        ringsData={ripples}
        ringColor={() => '#60a5fa'}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        htmlElementsData={allMarkers}
        htmlElement={renderElement}
        htmlTransitionDuration={0} 
      />
    </div>
  );
});

export default HomeGlobe;