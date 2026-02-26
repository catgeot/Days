// src/components/HomeGlobe.jsx
// 🚨 [Fix] 테마 스위치 속성(globeTheme) 적용 및 비주얼 리터칭(텍스처, 대기권 컬러 동적 할당)
// 🚨 [Fix/New] 수정 이유: 
// 1. [Maintainability] 'GLOBE_CAMERA_CONFIG' 통제실 신설 및 확대/자전 정지 임계값(Threshold) 세분화.
// 2. [UX & Performance] 지정 고도(FLY_DISABLE_ALT) 이하로 확대 시 flyTo(카메라 이동) 및 물방울(Ripple) 생성을 완전 생략(Bypass)하여 프레임 드랍 원천 차단. (Subtraction over Addition 적용)
// 3. [UX & Motion] 지정 고도(AUTO_ROTATE_DISABLE_ALT) 이하 진입 시 실시간으로 자전을 즉시 정지하여 3D 멀미 방지 및 시선 분산 방지.
// 4. [UX/New] 라벨 렌더링 시 offLat, offLng 속성을 참조하여 겹침 방지 (Pessimistic First 원칙 적용: 값 없을 시 0 기본값)
// 5. [New] Zen Mode 감속 로직 추가: isZenMode 활성화 시 자전 속도를 0.15로 대폭 감속하여 힐링 극대화.
// 6. [Fix] Zen Mode 시 기능 완벽 통제(Subtraction): 클릭 이벤트 조기 종료(return)로 핀 생성 방지 및 마커/라벨 데이터 빈 배열([]) 처리로 완전 은닉.
// 7. [Fix/New] 모바일 터치 관통 방어: PC 환경(마우스)은 100% 보존하고, 모바일의 '터치' 이벤트에서만 캔버스로의 전파를 차단하여 이중 클릭 버그 해결.
// 8. 🚨 [New] 모바일 줌(Zoom) 물리적 제한: 모바일(width < 768) 환경에서 텍스트 노출 고도(1.7) 이하로의 확대를 원천 차단하여 렌더링 병목(터치 지연) 현상 해결.
// 9. 🚨 [Fix] 모바일 라벨 해상도 저하: 모바일 환경 진입 시 LABEL_RESOLUTION을 2에서 1로 강제 다운그레이드하여 GPU 텍스처 메모리 소모 방어.

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { getMarkerDesign } from '../data/markers'; 
import { citiesData } from '../data/citiesData'; 

const GLOBE_CAMERA_CONFIG = {
  DEFAULT_ALT: 2.5,                 
  ZOOM_THRESHOLD: 2.2,              
  AUTO_ROTATE_DISABLE_ALT: 2.2,     
  FLY_DISABLE_ALT: 1.8,             
  FLY_DURATION: 3000,               
  IDLE_DELAY_ZOOMED_OUT: 4000,      
  AUTO_ROTATE_SPEED: 0.5,           
  LABEL_RESOLUTION: 2               
};

const HomeGlobe = forwardRef(({ 
  onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [], 
  tempPinsData = [], 
  travelSpots = [],
  activePinId,
  pauseRender = false,
  globeTheme = 'neon',
  isZenMode = false 
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
        const currentAlt = globeEl.current.pointOfView().altitude;

        if (currentAlt <= GLOBE_CAMERA_CONFIG.FLY_DISABLE_ALT) {
          globeEl.current.controls().autoRotate = false;
          return; 
        }

        globeEl.current.controls().autoRotate = false; 
        
        const isZoomedIn = currentAlt < GLOBE_CAMERA_CONFIG.ZOOM_THRESHOLD;
        const targetAlt = isZoomedIn ? currentAlt : GLOBE_CAMERA_CONFIG.DEFAULT_ALT; 

        globeEl.current.pointOfView({ lat, lng, altitude: targetAlt }, GLOBE_CAMERA_CONFIG.FLY_DURATION);
      
        const newRipple = { lat, lng, maxR: 8, propagationSpeed: 3, repeatPeriod: 800 };
        setRipples(prev => [...prev, newRipple]);
        setTimeout(() => setRipples(prev => prev.filter(r => r !== newRipple)), 2000);

        if (isZoomedIn) {
          // 탐색 모드: 완전히 정지
        } else {
          const totalWaitTime = GLOBE_CAMERA_CONFIG.FLY_DURATION + GLOBE_CAMERA_CONFIG.IDLE_DELAY_ZOOMED_OUT;
          rotationTimer.current = setTimeout(() => { 
            const checkAlt = globeEl.current ? globeEl.current.pointOfView().altitude : 99;
            if (globeEl.current && !pauseRender && checkAlt > GLOBE_CAMERA_CONFIG.AUTO_ROTATE_DISABLE_ALT) {
               globeEl.current.controls().autoRotate = true; 
            }
          }, totalWaitTime);
        }
      }
    },
    updateLastPinName: () => {}, 
    resetPins: () => {
        setRipples([]); 
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.pointOfView({ altitude: GLOBE_CAMERA_CONFIG.DEFAULT_ALT }, 1500); 
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

  // 🚨 [Fix/New] 해상도 및 디바이스(모바일/PC) 변경 감지 시 물리적 줌 락(Lock) 갱신
  useEffect(() => {
    if (!globeEl.current || !globeEl.current.controls) return;
    const controls = globeEl.current.controls();
    if (!controls) return;

    const isMobile = dimensions.width < 768;
    try {
      // getGlobeRadius()로 동적 계산: 모바일은 고도 1.7에서 물리적 차단, PC는 기존 1.01(거의 지표면) 유지
      const R = globeEl.current.getGlobeRadius();
      controls.minDistance = isMobile ? R * (1 + 1.7) : R * 1.01;
    } catch (e) {
      // Fallback: 계산 실패 시 안전 장치
      controls.minDistance = isMobile ? 270 : 101; 
    }
  }, [dimensions.width, pauseRender]); 

  useEffect(() => {
    const initCameraListener = () => {
      if (!globeEl.current || !globeEl.current.controls) return;
      const controls = globeEl.current.controls();
      if (!controls) return;

      const handleCameraChange = () => {
        if (!globeEl.current) return;
        const alt = globeEl.current.pointOfView().altitude;
        
        // 🚨 [Fix] 모바일 락 지점(1.7)에 도달했을 때 라벨이 렌더링되도록 <= 1.7 로 보정
        const newLevel = alt <= 1.7 ? 1 : 0;
        if (newLevel !== lodLevelRef.current) {
          lodLevelRef.current = newLevel;
          setLodLevel(newLevel);
        }

        if (!pauseRender && globeEl.current.controls) {
          if (alt <= GLOBE_CAMERA_CONFIG.AUTO_ROTATE_DISABLE_ALT) {
            globeEl.current.controls().autoRotate = false; 
          } else {
            globeEl.current.controls().autoRotate = true;  
          }
        }
      };

      controls.addEventListener('change', handleCameraChange);
      return () => controls.removeEventListener('change', handleCameraChange);
    };

    const timeoutId = setTimeout(initCameraListener, 500);
    return () => clearTimeout(timeoutId);
  }, [pauseRender]);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = !pauseRender;
      globeEl.current.controls().autoRotateSpeed = isZenMode ? 0.15 : GLOBE_CAMERA_CONFIG.AUTO_ROTATE_SPEED; 
      if (pauseRender && rotationTimer.current) clearTimeout(rotationTimer.current); 
    }
  }, [pauseRender, isZenMode]);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = !pauseRender;
      globeEl.current.controls().autoRotateSpeed = GLOBE_CAMERA_CONFIG.AUTO_ROTATE_SPEED; 
      globeEl.current.pointOfView({ altitude: GLOBE_CAMERA_CONFIG.DEFAULT_ALT }); 
    }
  }, []); 

  const handleGlobeClickInternal = ({ lat, lng }) => {
    if (isZenMode) return; 
    
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
    
    el.ontouchstart = (e) => {
      e.stopPropagation();
    };
    
    el.onpointerdown = (e) => {
      if (e.pointerType === 'touch') {
        e.stopPropagation();
      }
    };

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
        
        htmlElementsData={isZenMode ? [] : allMarkers}
        htmlElement={renderElement}
        htmlTransitionDuration={0} 

        labelsData={isZenMode ? [] : visibleLabels}
        labelLat={d => d.lat + (d.offLat || 0)}
        labelLng={d => d.lng + (d.offLng || 0)}
        labelText={d => d.name_en}
        labelSize={d => d.priority === 1 ? 1.2 : 0.7}
        labelDotRadius={0.15}
        labelColor={d => d.priority === 1 ? 'rgba(0, 247, 255, 1)' : 'rgba(103, 232, 249, 0.85)'}
        // 🚨 [Fix/New] 모바일 렌더링 부하 50% 절감 (PC는 2, 모바일은 1)
        labelResolution={dimensions.width < 768 ? 1 : GLOBE_CAMERA_CONFIG.LABEL_RESOLUTION} 
        labelAltitude={0.01}
        
        onLabelClick={(d, event) => {
          if (onMarkerClick) onMarkerClick({ ...d, type: 'city-label' }, 'globe');
        }}
      />
    </div>
  );
});

export default HomeGlobe;