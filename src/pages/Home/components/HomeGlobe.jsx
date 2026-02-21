// src/components/HomeGlobe.jsx
// 🚨 [Fix] 테마 스위치 속성(globeTheme) 적용 및 비주얼 리터칭(텍스처, 대기권 컬러 동적 할당)
// 🚨 [Fix/New] 수정 이유: 
// 1. [Maintainability] 'GLOBE_CAMERA_CONFIG' 통제실을 신설하여 흩어져 있던 매직 넘버(고도, 시간, 속도, 해상도)를 한 곳에서 관리 가능하도록 아키텍처 개선.
// 2. [UX & Performance] 확대(탐색 모드) 상태에서 flyTo 시 자전을 영구 정지하여 브라우저 연산 부하(프레임 저하)를 막고 독서 UX를 극대화. (옵션 1)
// 3. [UX] 기본 고도(우주 모드)에서는 비행 완료 후 4초의 인지 대기 시간을 거친 뒤 부드럽게 자전을 재개하도록 수정. (옵션 2)

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { getMarkerDesign } from '../data/markers'; 
import { citiesData } from '../data/citiesData'; 

// 🚨 [Fix/New] 수석님 전용 환경 설정(Config) 통제실
// 이제 코드를 뜯어볼 필요 없이 여기서 모든 카메라 및 애니메이션 수치를 튜닝하십시오.
const GLOBE_CAMERA_CONFIG = {
  DEFAULT_ALT: 2.5,                 // 기본 우주 고도
  ZOOM_THRESHOLD: 2.2,              // 탐색/확대 모드 진입 기준 고도 (이보다 낮으면 확대된 것으로 간주)
  FLY_DURATION: 3000,               // 목적지 비행 시간 (ms)
  IDLE_DELAY_ZOOMED_OUT: 4000,      // 기본 고도 도착 후 자전 재개 전 감상/대기 시간 (ms)
  AUTO_ROTATE_SPEED: 0.5,           // 평상시 자전 속도
  LABEL_RESOLUTION: 2               // 텍스트 해상도 (기기가 버벅일 경우 1~1.5로 하향 조절하여 메모리 확보)
};

const HomeGlobe = forwardRef(({ 
  onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [], 
  tempPinsData = [], 
  travelSpots = [],
  activePinId,
  pauseRender = false,
  globeTheme = 'neon' 
}, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  const [ripples, setRipples] = useState([]);
  const isHoveringMarker = useRef(false);

  const [lodLevel, setLodLevel] = useState(0);
  const lodLevelRef = useRef(0);

  const themeConfig = useMemo(() => {
    switch(globeTheme) {
      case 'neon': 
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          atmColor: "#00ffff", 
          atmAlt: 0.25
        };
      case 'bright': 
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-day.jpg",
          atmColor: "#ffffff", 
          atmAlt: 0.3
        };
      case 'deep': 
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          atmColor: "#e2fb03", 
          atmAlt: 0.20
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
        
        // 🚨 [Fix/New] Config 통제실 변수 적용
        const currentAlt = globeEl.current.pointOfView().altitude;
        const isZoomedIn = currentAlt < GLOBE_CAMERA_CONFIG.ZOOM_THRESHOLD;
        const targetAlt = isZoomedIn ? currentAlt : GLOBE_CAMERA_CONFIG.DEFAULT_ALT; 

        globeEl.current.pointOfView({ lat, lng, altitude: targetAlt }, GLOBE_CAMERA_CONFIG.FLY_DURATION);
      
        const newRipple = { lat, lng, maxR: 8, propagationSpeed: 3, repeatPeriod: 800 };
        setRipples(prev => [...prev, newRipple]);
        setTimeout(() => setRipples(prev => prev.filter(r => r !== newRipple)), 2000);

        // 🚨 [Fix/New] 자전 재개 분기 로직 (옵션 1 & 2 결합)
        if (isZoomedIn) {
          // 탐색 모드: 자전을 재개하는 타이머를 세팅하지 않고 완전히 정지시킵니다. (성능 확보 및 편안한 UX)
        } else {
          // 우주 모드: 비행 완료 후 설정된 대기 시간(4초)을 거친 뒤 부드럽게 자전을 시작합니다.
          const totalWaitTime = GLOBE_CAMERA_CONFIG.FLY_DURATION + GLOBE_CAMERA_CONFIG.IDLE_DELAY_ZOOMED_OUT;
          rotationTimer.current = setTimeout(() => { 
            if (globeEl.current && !pauseRender) globeEl.current.controls().autoRotate = true; 
          }, totalWaitTime);
        }
      }
    },
    updateLastPinName: () => {}, 
    resetPins: () => {
        setRipples([]); 
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.pointOfView({ altitude: GLOBE_CAMERA_CONFIG.DEFAULT_ALT }, 1500); // 🚨 Config 적용
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
        const newLevel = alt < 1.7 ? 1 : 0;
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
      globeEl.current.controls().autoRotateSpeed = GLOBE_CAMERA_CONFIG.AUTO_ROTATE_SPEED; // 🚨 Config 적용
      globeEl.current.pointOfView({ altitude: GLOBE_CAMERA_CONFIG.DEFAULT_ALT }); // 🚨 Config 적용
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
        labelText={d => d.name_en}
        labelSize={d => d.priority === 1 ? 1.2 : 0.8}
        labelDotRadius={0.15}
        labelColor={d => d.priority === 1 ? 'rgba(0, 247, 255, 1)' : 'rgba(103, 232, 249, 0.85)'}
        labelResolution={GLOBE_CAMERA_CONFIG.LABEL_RESOLUTION} // 🚨 Config 적용
        labelAltitude={0.01}
        
        onLabelClick={(d, event) => {
          if (onMarkerClick) onMarkerClick({ ...d, type: 'city-label' }, 'globe');
        }}
      />
    </div>
  );
});

export default HomeGlobe;