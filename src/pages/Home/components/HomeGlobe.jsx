// src/components/HomeGlobe.jsx
// 🚨 [Fix] 테마 스위치 속성(globeTheme) 적용 및 비주얼 리터칭(텍스처, 대기권 컬러 동적 할당)
// 🚨 [Fix/New] 수정 이유: 
// 1. [Maintainability] 'GLOBE_CAMERA_CONFIG' 통제실 신설 및 확대/자전 정지 임계값(Threshold) 세분화.
// 2. [UX & Performance] 지정 고도(FLY_DISABLE_ALT) 이하로 확대 시 flyTo(카메라 이동) 및 물방울(Ripple) 생성을 완전 생략(Bypass)하여 프레임 드랍 원천 차단. (Subtraction over Addition 적용)
// 3. [UX & Motion] 지정 고도(AUTO_ROTATE_DISABLE_ALT) 이하 진입 시 실시간으로 자전을 즉시 정지하여 3D 멀미 방지 및 시선 분산 방지.
// 4. [UX/New] 라벨 렌더링 시 offLat, offLng 속성을 참조하여 겹침 방지 (Pessimistic First 원칙 적용: 값 없을 시 0 기본값)
// 5. 🚨 [New] Zen Mode 감속 로직 추가: isZenMode 활성화 시 자전 속도를 0.15로 대폭 감속하여 힐링 극대화.
// 6. 🚨 [Fix] Zen Mode 시 기능 완벽 통제(Subtraction): 클릭 이벤트 조기 종료(return)로 핀 생성 방지 및 마커/라벨 데이터 빈 배열([]) 처리로 완전 은닉.

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { getMarkerDesign } from '../data/markers'; 
import { citiesData } from '../data/citiesData'; 

// 🚨 [Fix/New] 수석님 전용 환경 설정(Config) 통제실
// 고도에 따른 애니메이션 차단/정지 수치를 여기서 미세 조정하십시오.
const GLOBE_CAMERA_CONFIG = {
  DEFAULT_ALT: 2.5,                 // 기본 우주 고도
  ZOOM_THRESHOLD: 2.2,              // 탐색 모드 진입 기준 고도 (기본적인 로직 분기점)
  AUTO_ROTATE_DISABLE_ALT: 2.2,     // 🚨 [New] 이 고도 이하면 마우스 휠만 굴려도 자전이 즉시 정지됨 (멀미 방지)
  FLY_DISABLE_ALT: 1.8,             // 🚨 [New] 이 고도 이하면 클릭 시 카메라 이동(flyTo)과 물방울 이펙트 완전 생략 (프레임 드랍 방지)
  FLY_DURATION: 3000,               // 목적지 비행 시간 (ms)
  IDLE_DELAY_ZOOMED_OUT: 4000,      // 기본 고도 도착 후 자전 재개 전 감상/대기 시간 (ms)
  AUTO_ROTATE_SPEED: 0.5,           // 평상시 자전 속도
  LABEL_RESOLUTION: 2               // 텍스트 해상도
};

const HomeGlobe = forwardRef(({ 
  onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [], 
  tempPinsData = [], 
  travelSpots = [],
  activePinId,
  pauseRender = false,
  globeTheme = 'neon',
  isZenMode = false // 🚨 [New] Zen Mode 상태 수신
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

        // 🚨 [Fix/New] 확대 상태 시 애니메이션 원천 차단 (Subtraction over Addition)
        // 현재 고도가 FLY_DISABLE_ALT 이하라면 카메라 이동과 물방울 이펙트를 생략합니다.
        if (currentAlt <= GLOBE_CAMERA_CONFIG.FLY_DISABLE_ALT) {
          globeEl.current.controls().autoRotate = false;
          // 카메라 이동 없이 즉시 함수 종료. (클릭 이벤트 자체는 상위로 전달되어 패널은 정상 작동함)
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
          // 탐색 모드: 자전을 재개하는 타이머를 세팅하지 않고 완전히 정지시킵니다.
        } else {
          // 우주 모드: 비행 완료 후 설정된 대기 시간(4초)을 거친 뒤 부드럽게 자전을 시작합니다.
          const totalWaitTime = GLOBE_CAMERA_CONFIG.FLY_DURATION + GLOBE_CAMERA_CONFIG.IDLE_DELAY_ZOOMED_OUT;
          rotationTimer.current = setTimeout(() => { 
            // 🚨 [Safe Check] 대기 시간이 끝난 시점의 고도를 다시 측정하여 안전하게 자전 재개 여부 결정
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

  useEffect(() => {
    const initCameraListener = () => {
      if (!globeEl.current || !globeEl.current.controls) return;
      const controls = globeEl.current.controls();
      if (!controls) return;

      const handleCameraChange = () => {
        if (!globeEl.current) return;
        const alt = globeEl.current.pointOfView().altitude;
        
        // 1. LOD(디테일 수준) 계산
        const newLevel = alt < 1.7 ? 1 : 0;
        if (newLevel !== lodLevelRef.current) {
          lodLevelRef.current = newLevel;
          setLodLevel(newLevel);
        }

        // 2. 실시간 자전 차단/재개 로직 (멀미 방지)
        if (!pauseRender && globeEl.current.controls) {
          if (alt <= GLOBE_CAMERA_CONFIG.AUTO_ROTATE_DISABLE_ALT) {
            globeEl.current.controls().autoRotate = false; // 진입 시 즉시 정지
          } else {
            globeEl.current.controls().autoRotate = true;  // 우주로 멀어지면 자동 재개
          }
        }
      };

      controls.addEventListener('change', handleCameraChange);
      return () => controls.removeEventListener('change', handleCameraChange);
    };

    const timeoutId = setTimeout(initCameraListener, 500);
    return () => clearTimeout(timeoutId);
  }, [pauseRender]);

  // Zen Mode 자전 속도 컨트롤 (의존성에 isZenMode 추가)
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
    // 🚨 [Fix] 뺄셈의 미학: Zen Mode 상태일 경우 하위 로직 실행 및 상위로의 이벤트 전달을 즉시 차단합니다.
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
        
        // {/* 🚨 [Fix] 뺄셈의 미학: Zen Mode 시 복잡한 계산식(allMarkers)을 렌더링 파이프라인에 넣지 않고 빈 배열로 덮어버립니다. */}
        htmlElementsData={isZenMode ? [] : allMarkers}
        htmlElement={renderElement}
        htmlTransitionDuration={0} 

        // {/* 🚨 [Fix] 동일하게 라벨도 빈 배열로 처리하여 완전히 숨깁니다. */}
        labelsData={isZenMode ? [] : visibleLabels}
        labelLat={d => d.lat + (d.offLat || 0)}
        labelLng={d => d.lng + (d.offLng || 0)}
        labelText={d => d.name_en}
        labelSize={d => d.priority === 1 ? 1.2 : 0.5}
        labelDotRadius={0.15}
        labelColor={d => d.priority === 1 ? 'rgba(0, 247, 255, 1)' : 'rgba(103, 232, 249, 0.85)'}
        labelResolution={GLOBE_CAMERA_CONFIG.LABEL_RESOLUTION} 
        labelAltitude={0.01}
        
        onLabelClick={(d, event) => {
          if (onMarkerClick) onMarkerClick({ ...d, type: 'city-label' }, 'globe');
        }}
      />
    </div>
  );
});

export default HomeGlobe;