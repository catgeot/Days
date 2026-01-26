// src/pages/Home/components/HomeGlobe.jsx
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';

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

  // 호버 락(Hover Lock) 변수
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
    if (isHoveringMarker.current) return; // 호버 락 작동
    if (onGlobeClick) onGlobeClick({ lat, lng });
  };

  // 🚨 [Logic Upgrade] 상태 병합 (Merge State) & 핀 온 탑
  const allMarkers = useMemo(() => {
    let result = [];
    const threshold = 0.05; 

    const findMatchIndex = (lat, lng) => 
        result.findIndex(m => Math.abs(m.lat - lat) < threshold && Math.abs(m.lng - lng) < threshold);

    // 1. Layer 1: Travel Spots (Major)
    travelSpots.forEach(spot => {
        result.push({ ...spot, type: 'major', priority: 0 });
    });

    // 2. Layer 2: Saved Trips
    savedTrips.forEach(trip => {
        const idx = findMatchIndex(trip.lat, trip.lng);
        if (idx !== -1) {
            result[idx] = { ...trip, type: 'saved-trip', priority: 4 };
        } else {
            result.push({ ...trip, type: 'saved-trip', priority: 4 });
        }
    });

    // 3. Layer 3: Temp Pins (Active & Ghosts)
    tempPinsData.forEach(pin => {
        const idx = findMatchIndex(pin.lat, pin.lng);
        const isActive = (pin.id === activePinId);

        if (idx !== -1) {
            // 중첩 발생!
            if (isActive) {
                // 현재 선택된 녀석이면 Active 깃발 꽂기
                result[idx].isActive = true;
                result[idx].isGhost = false; // Active가 Ghost보다 우선
            } else {
                // 🚨 핵심: 선택된 건 아닌데 리스트에 있다? -> 방문했던 곳(Ghost)
                // 기존 아이콘(Major/Saved)에 Ghost 속성 병합
                result[idx].isGhost = true; 
            }
        } else {
            // 겹치지 않는 빈 땅: 독립적인 핀 생성
            result.push({ 
                ...pin, 
                type: isActive ? 'active' : 'ghost', 
                isActive: isActive,
                isGhost: !isActive // Active가 아니면 Ghost
            });
        }
    });

    return result;
  }, [travelSpots, savedTrips, tempPinsData, activePinId]);

  const renderElement = (d) => {
    const el = document.createElement('div');
    el.style.position = 'absolute'; el.style.pointerEvents = 'auto';

    let iconContent = '';
    let scale = '1';
    let offsetY = '-50%'; 
    let zIndex = '10';

    // --- 기본 아이콘 렌더링 ---
    if (d.type === 'saved-trip') {
        zIndex = '100';
        iconContent = `
            <div style="filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.5));">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            </div>`;
    }
    else if (d.type === 'chat') {
        zIndex = '150';
        iconContent = `
            <div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    <path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/>
                </svg>
            </div>`;
    }
    else if (d.type === 'active') { 
        zIndex = '200';
        scale = '1.0'; 
        offsetY = '-100%'; 
        iconContent = `<div style="width:1px; height:1px;"></div>`; // 내용은 Overlay가 담당
    }
    // 🚨 [Restore] 독립된 Ghost Pin (시인성 강화: Opacity 0.85, 붉은색 유지)
    else if (d.type === 'ghost') {
        zIndex = '50';
        offsetY = '-100%';
        scale = '0.9'; 
        iconContent = `
            <div style="opacity: 0.85; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#991b1b"/>
                </svg>
            </div>`;
    }
    else { // Major
        let colorClass = '#94a3b8';
        if (d.category === 'paradise') colorClass = '#22d3ee';
        else if (d.category === 'nature') colorClass = '#4ade80';
        else if (d.category === 'urban') colorClass = '#c084fc';
        else if (d.category === 'nearby') colorClass = '#facc15';
        else if (d.category === 'adventure') colorClass = '#f87171';
        
        iconContent = `
           <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.7); backdrop-filter: blur(2px); border: 1px solid ${colorClass}80; padding: 3px 8px; border-radius: 99px;">
             <div style="width: 8px; height: 8px; background: ${colorClass}; border-radius: 50%; box-shadow: 0 0 5px ${colorClass};"></div>
             <span style="color: white; font-size: 10px; font-weight: bold; white-space: nowrap;">${d.name}</span>
           </div>`;
    }

    // --- Overlay (Pin on Top) ---
    let overlay = '';
    
    // 1. 현재 선택된 핀 (Active): 통통 튀는 애니메이션, 제일 큼
    if (d.isActive) {
        zIndex = '999'; 
        overlay = `
            <div style="position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%); width: 32px; height: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); animation: pinBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1;">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#991b1b"/>
                </svg>
                <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid #7f1d1d;"></div>
            </div>
        `;
    }
    // 2. 🚨 [New] 기존 핀 위의 잔상 (Ghost Overlay): 정지됨, 약간 작음, 붉은색
    else if (d.isGhost && (d.type === 'major' || d.type === 'saved-trip')) {
        zIndex = '900'; // Active보단 아래, 텍스트보단 위
        overlay = `
            <div style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); width: 24px; height: 24px; opacity: 0.85; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#991b1b"/>
                </svg>
            </div>
        `;
    }

    el.innerHTML = `
      <div style="position: absolute; transform: translate(-50%, ${offsetY}); cursor: pointer; transition: transform 0.2s ease;">
        ${overlay}
        <div style="transform: scale(${scale});">${iconContent}</div>
      </div>
      <style>
        @keyframes pinBounce {
          0% { transform: translateX(-50%) translateY(-50px); opacity: 0; }
          60% { transform: translateX(-50%) translateY(10px); opacity: 1; }
          80% { transform: translateX(-50%) translateY(-5px); }
          100% { transform: translateX(-50%) translateY(0); }
        }
      </style>
    `;

    el.onclick = (e) => { 
      e.stopPropagation(); 
      if (onMarkerClick) onMarkerClick(d, 'globe'); 
    };
    
    // 호버 스케일: 1.5배 유지
    el.onmouseenter = () => { 
      isHoveringMarker.current = true;
      el.querySelector('div').style.transform = `translate(-50%, ${offsetY}) scale(1.5)`; 
    };
    el.onmouseleave = () => { 
      isHoveringMarker.current = false;
      el.querySelector('div').style.transform = `translate(-50%, ${offsetY}) scale(1)`; 
    };

    el.style.zIndex = zIndex; 
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