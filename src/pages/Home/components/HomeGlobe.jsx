// src/components/HomeGlobe.jsx
// 🚨 [Fix] 테마 스위치 속성(globeTheme) 적용 및 비주얼 리터칭(텍스처, 대기권 컬러 동적 할당)

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { getMarkerDesign } from '../data/markers'; 
import { citiesData } from '../data/citiesData'; 

const HomeGlobe = forwardRef(({ 
  onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [], 
  tempPinsData = [], 
  travelSpots = [],
  activePinId,
  pauseRender = false,
  globeTheme = 'neon' // 🚨 [New] 테마 프롭스 수신
}, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  const [ripples, setRipples] = useState([]);
  const isHoveringMarker = useRef(false);

  const [lodLevel, setLodLevel] = useState(0);
  const lodLevelRef = useRef(0);

  // 🚨 [New] 테마별 지구본 렌더링 설정 (Pessimistic: default 설정 마련)
  const themeConfig = useMemo(() => {
    switch(globeTheme) {
      case 'neon': // 맑은 형광빛 바다
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          atmColor: "#00ffff", // 투명한 시안
          atmAlt: 0.20
        };
      case 'bright': // 수심이 맑게 보이는 Day 텍스처
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-day.jpg",
          atmColor: "#87ceeb", // 밝은 스카이블루
          atmAlt: 0.15
        };
      case 'deep': // 묵직하고 신비로운 딥 블루
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          atmColor: "#4b6bfa", // 짙은 파랑
          atmAlt: 0.15
        };
      default:
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          atmColor: "#00ffff",
          atmAlt: 0.20
        };
    }
  }, [globeTheme]);

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
    resetPins: () => {
        setRipples([]); 
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.pointOfView({ altitude: 2.5 }, 1500); 
        }
        if (rotationTimer.current) {
            clearTimeout(rotationTimer.current);
            rotationTimer.current = null;
        }
    }, 
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
        const newLevel = alt < 1.6 ? 1 : 0;
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
            result[idx].tripId = trip.id; 
        } else {
            result.push({ 
                ...trip, 
                name: fixedName, 
                type: 'temp-base', 
                priority: isBookmarked ? 4 : 3, 
                isBookmarked: isBookmarked, 
                hasChat: !isBookmarked 
            });
        }
    });

    const activePin = tempPinsData.find(p => p.id === activePinId);
    
    if (tempPinsData && tempPinsData.length > 0) {
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
    }
    
    return result;
  }, [travelSpots, savedTrips, tempPinsData, activePinId]);

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
      const innerDiv = el.querySelector('div');
      if(innerDiv) innerDiv.style.transform = `translate(-50%, ${offsetY}) scale(1.5)`; 
    };
    el.onmouseleave = () => { 
      isHoveringMarker.current = false;
      const innerDiv = el.querySelector('div');
      if(innerDiv) innerDiv.style.transform = `translate(-50%, ${offsetY}) scale(1)`; 
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
        
        // 🚨 [Fix] 테마 구성에 따른 동적 할당
        globeImageUrl={themeConfig.imageUrl}
        atmosphereColor={themeConfig.atmColor}
        atmosphereAltitude={themeConfig.atmAlt}
        
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
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
        labelSize={d => d.priority === 1 ? 1.2 : 0.8}
        labelDotRadius={0.15}
				 // 🚨 [Fix] Option 1: 미래적인 네온 블루 (시인성 최상)
				// labelColor={d => d.priority === 1 ? 'rgba(0, 247, 255, 1)' : 'rgba(103, 232, 249, 0.85)'}

				// 🚨 [Fix] Option 2: 강렬한 핫핑크/마젠타 (대비 효과 극대화)
				labelColor={d => d.priority === 1 ? 'rgba(255, 20, 147, 1)' : 'rgba(251, 113, 133, 0.85)'}

				// 🚨 [Fix] Option 3: 테크니컬한 라임 그린 (매트릭스 스타일)
				// labelColor={d => d.priority === 1 ? 'rgba(57, 255, 20, 1)' : 'rgba(134, 239, 172, 0.85)'}
        labelResolution={2}
        labelAltitude={0.01}
        
        onLabelClick={(d, event) => {
          if (onMarkerClick) onMarkerClick({ ...d, type: 'city-label' }, 'globe');
        }}
      />
    </div>
  );
});

export default HomeGlobe;