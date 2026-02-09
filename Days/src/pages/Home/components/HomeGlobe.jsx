// src/pages/Home/components/HomeGlobe.jsx
// 🚨 [Fix] 자전 버그 수정(타이머 폭파) 및 렌더링 제어 로직

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { getMarkerDesign } from '../data/markers'; 

const HomeGlobe = forwardRef(({ 
  onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [], 
  tempPinsData = [], 
  travelSpots = [],
  activePinId,
  pauseRender = false // 렌더링 중지 플래그
}, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  const [ripples, setRipples] = useState([]);

  // 🔒 호버 락(Hover Lock) 변수
  const isHoveringMarker = useRef(false);

  // 🚨 [Fix] 사용자 상호작용 감지 시 자전 타이머 즉시 폭파
  const handleInteraction = () => {
    if (rotationTimer.current) {
      clearTimeout(rotationTimer.current);
      rotationTimer.current = null;
    }
    // 사용자가 만지면 자전 멈춤
    if (globeEl.current) globeEl.current.controls().autoRotate = false;
  };

  useImperativeHandle(ref, () => ({
    pauseRotation: () => { 
      if(globeEl.current) globeEl.current.controls().autoRotate = false; 
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    },
    resumeRotation: () => { 
      if (pauseRender) return; // Focus Mode일 때는 명령 무시
      if(globeEl.current) globeEl.current.controls().autoRotate = true; 
    },
    
    flyToAndPin: (lat, lng, name, category) => {
      // 기존 타이머 제거 (중복 실행 방지)
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
      
      if (globeEl.current) {
        globeEl.current.controls().autoRotate = false; 
        globeEl.current.pointOfView({ lat, lng, altitude: 2.0 }, 1000);
      }
      
      const newRipple = { lat, lng, maxR: 8, propagationSpeed: 3, repeatPeriod: 800 };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => setRipples(prev => prev.filter(r => r !== newRipple)), 2000);

      // 🚨 [Fix] 3초 후 자전 재개 (단, 사용자가 건드리면 handleInteraction에서 취소됨)
      rotationTimer.current = setTimeout(() => { 
        if (globeEl.current && !pauseRender) {
          globeEl.current.controls().autoRotate = true; 
        }
      }, 3000);
    },
    updateLastPinName: () => {}, 
    resetPins: () => {}, 
  }));

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); };
  }, []);

  // 🚨 [Fix] pauseRender 상태에 반응하여 회전 제어
  useEffect(() => {
    if (globeEl.current) {
      if (pauseRender) {
        globeEl.current.controls().autoRotate = false;
        if (rotationTimer.current) clearTimeout(rotationTimer.current); // 타이머도 정리
      } else {
        // Focus Mode가 풀리면 다시 자전 시작 (선택 사항, 여기서는 켬)
        globeEl.current.controls().autoRotate = true;
      }
    }
  }, [pauseRender]);

  // 초기 로딩
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = !pauseRender;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ altitude: 2.5 }); 
    }
  }, []); 

  const handleGlobeClickInternal = ({ lat, lng }) => {
    if (isHoveringMarker.current) return; 
    if (pauseRender) return; 
    if (onGlobeClick) onGlobeClick({ lat, lng });
  };

  // 🛡 [Protected Logic] (기존 마커 로직 유지)
  const allMarkers = useMemo(() => {
    let result = [];
    const threshold = 0.05; 
    const findMatchIndex = (lat, lng) => result.findIndex(m => Math.abs(m.lat - lat) < threshold && Math.abs(m.lng - lng) < threshold);

    travelSpots.forEach(spot => { result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false }); });

    let chatCount = 0; 
    savedTrips.forEach(trip => {
        const isBookmarked = trip.is_bookmarked;
        if (!isBookmarked) { if (chatCount >= 5) return; chatCount++; }
        const idx = findMatchIndex(trip.lat, trip.lng);
        const fixedName = trip.name || trip.destination || "Saved Place";
        if (idx !== -1) {
            if (isBookmarked) result[idx].isBookmarked = true;
            else result[idx].hasChat = true;
            result[idx].id = trip.id; 
        } else {
            result.push({ ...trip, name: fixedName, type: 'temp-base', priority: isBookmarked ? 4 : 3, isBookmarked: isBookmarked, hasChat: !isBookmarked });
        }
    });

    const activePin = tempPinsData.find(p => p.id === activePinId);
    tempPinsData.forEach(pin => {
        const isActive = (pin.id === activePinId);
        if (!isActive && activePin) { if (Math.abs(pin.lat - activePin.lat) < threshold && Math.abs(pin.lng - activePin.lng) < threshold) return; }
        const idx = findMatchIndex(pin.lat, pin.lng);
        if (idx !== -1) {
            if (isActive) { result[idx].isActive = true; result[idx].isGhost = false; }
            else { result[idx].isGhost = true; }
        } else {
            result.push({ ...pin, type: 'temp-base', name: pin.name || "Searching...", isActive: isActive, isGhost: !isActive });
        }
    });
    return result;
  }, [travelSpots, savedTrips, tempPinsData, activePinId]);

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
    // 🚨 [Fix] onPointerDown 이벤트로 상호작용 감지 -> 자전 재개 타이머 폭파
    <div 
      className={`absolute inset-0 z-0 transition-opacity duration-500 ${isChatOpen ? 'opacity-30' : 'opacity-100'}`}
      onPointerDown={handleInteraction}
    >
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