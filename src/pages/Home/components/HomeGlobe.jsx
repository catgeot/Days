// src/pages/Home/components/HomeGlobe.jsx
// 🚨 [Fix] 레이어 단일화(고도 1.5) 및 별자리 분산 전략(샴페인 골드 색상/크기) 완벽 적용

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { getMarkerDesign } from '../data/markers'; 
import { citiesData } from '../data/citiesData'; 

const HomeGlobe = forwardRef(({ 
  onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [], 
  tempPinsData = [], 
  travelSpots = [],
  activePinId,
  pauseRender = false 
}, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  const [ripples, setRipples] = useState([]);
  const isHoveringMarker = useRef(false);

  // 🚨 [Fix] 복잡한 LOD 상태 제거: 0(우주/마커 On), 1(탐험/라벨 On) 두 가지 상태로만 심플하게 관리
  const [lodLevel, setLodLevel] = useState(0);
  const lodLevelRef = useRef(0);

  const handleInteraction = () => {
    if (rotationTimer.current) {
      clearTimeout(rotationTimer.current);
      rotationTimer.current = null;
    }
    if (globeEl.current) globeEl.current.controls().autoRotate = false;
  };

  useImperativeHandle(ref, () => ({
    pauseRotation: () => { 
      if(globeEl.current) globeEl.current.controls().autoRotate = false; 
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    },
    resumeRotation: () => { 
      if (pauseRender) return; 
      if(globeEl.current) globeEl.current.controls().autoRotate = true; 
    },
    flyToAndPin: (lat, lng, name, category) => {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
      if (globeEl.current) {
        globeEl.current.controls().autoRotate = false; 
        globeEl.current.pointOfView({ lat, lng, altitude: 2.0 }, 1000);
      }
      const newRipple = { lat, lng, maxR: 8, propagationSpeed: 3, repeatPeriod: 800 };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => setRipples(prev => prev.filter(r => r !== newRipple)), 2000);

      rotationTimer.current = setTimeout(() => { 
        if (globeEl.current && !pauseRender) globeEl.current.controls().autoRotate = true; 
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

  useEffect(() => {
    const initCameraListener = () => {
      if (!globeEl.current || !globeEl.current.controls) return;
      const controls = globeEl.current.controls();
      if (!controls) return;

      const handleCameraChange = () => {
        if (!globeEl.current) return;
        const alt = globeEl.current.pointOfView().altitude;
        
        // 🚨 [Fix] 단일 고도 임계점: 1.5 미만이면 무조건 1(On) 상태로 전환하여 모든 지표를 켬
        const newLevel = alt < 1.9 ? 1 : 0;

        if (newLevel !== lodLevelRef.current) {
          lodLevelRef.current = newLevel;
          setLodLevel(newLevel);
        }
      };

      controls.addEventListener('change', handleCameraChange);
      return () => controls.removeEventListener('change', handleCameraChange);
    };

    const timeoutId = setTimeout(initCameraListener, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = !pauseRender;
      if (pauseRender && rotationTimer.current) clearTimeout(rotationTimer.current); 
    }
  }, [pauseRender]);

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

  // 🚨 [Fix] 복잡한 필터링 제거: On(1) 상태면 citiesData 전체를 반환하여 렌더링 부하 최소화
  const visibleLabels = useMemo(() => {
    return lodLevel === 1 ? citiesData : [];
  }, [lodLevel]);

  const renderElement = (d) => {
    const el = document.createElement('div');
    el.className = 'globe-marker-wrapper'; 
    el.style.position = 'absolute'; 
    el.style.pointerEvents = 'auto';
    el.style.transition = 'opacity 0.4s ease';

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
    <div 
      className={`absolute inset-0 z-0 transition-opacity duration-500 ${isChatOpen ? 'opacity-30' : 'opacity-100'} ${lodLevel > 0 ? 'hide-markers' : ''}`}
      onPointerDown={handleInteraction}
    >
      <style>{`
        .hide-markers .globe-marker-wrapper { 
          opacity: 0 !important; 
          pointer-events: none !important; 
        }
      `}</style>

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

        labelsData={visibleLabels}
        labelLat={d => d.lat}
        labelLng={d => d.lng}
        labelText={d => d.name}
        // 🚨 [Fix] 원근감과 공간감을 위한 사이즈 이원화 (대양/대륙 크게, 지역 작게)
        labelSize={d => d.priority === 1 ? 1.2 : 0.8}
        labelDotRadius={0.15}
        // 🚨 [Fix] Option 1: 미래적인 네온 블루 (시인성 최상)
				// labelColor={d => d.priority === 1 ? 'rgba(0, 247, 255, 1)' : 'rgba(103, 232, 249, 0.85)'}

				// 🚨 [Fix] Option 2: 강렬한 핫핑크/마젠타 (대비 효과 극대화)
				// labelColor={d => d.priority === 1 ? 'rgba(255, 20, 147, 1)' : 'rgba(251, 113, 133, 0.85)'}

				// 🚨 [Fix] Option 3: 테크니컬한 라임 그린 (매트릭스 스타일)
				labelColor={d => d.priority === 1 ? 'rgba(57, 255, 20, 1)' : 'rgba(134, 239, 172, 0.85)'}

        labelResolution={2}
        labelAltitude={0.01}
        onLabelClick={(d) => {
          if (onMarkerClick) onMarkerClick({ ...d, type: 'city-label' }, 'globe');
        }}
      />
    </div>
  );
});

export default HomeGlobe;