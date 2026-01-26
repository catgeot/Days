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

  // 🚨 [Fix] 호버 락(Hover Lock) 변수: 마우스가 마커 위에 있는지 추적
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

  // 🚨 [Fix] 지구본 클릭 핸들러: 마커 위에 있을 땐(Hover Lock) 클릭 무시
  const handleGlobeClickInternal = ({ lat, lng }) => {
    if (isHoveringMarker.current) {
      // console.log("Blocked: Clicked on a marker"); 
      return; 
    }
    if (onGlobeClick) onGlobeClick({ lat, lng });
  };

  // 🚨 [Logic] 핀 중복 제거 및 위계 설정
  const allMarkers = useMemo(() => {
    // 1. Raw Data Collection
    const rawSaved = savedTrips.map(trip => ({ ...trip, type: 'saved-trip', priority: 4 })); // ⭐️ Highest
    const rawSpots = travelSpots.map(spot => ({ ...spot, type: 'major', priority: 0 })); // Seed
    
    const rawScouts = tempPinsData.map(pin => {
      // Active Pin (The Cursor)
      if (pin.id === activePinId) return { ...pin, type: 'active', priority: 2 };
      // Chat Pin (The Talker)
      if (pin.hasChat) return { ...pin, type: 'chat', priority: 3 };
      // Ghost Pin (The Trail)
      return { ...pin, type: 'ghost', priority: 1 };
    });

    const combined = [...rawSpots, ...rawSaved, ...rawScouts];

    // 2. Deduplication (Merge by Coordinate)
    const uniqueMarkers = [];
    const threshold = 0.05; // 좌표 오차 범위 (겹침 판단)

    combined.forEach(marker => {
      // 이미 등록된 마커 중 아주 가까운 녀석이 있는지 확인
      const existingIdx = uniqueMarkers.findIndex(m => 
        Math.abs(m.lat - marker.lat) < threshold && 
        Math.abs(m.lng - marker.lng) < threshold
      );

      if (existingIdx !== -1) {
        // 있다면, 계급(Priority)이 높은 녀석으로 교체
        if (marker.priority > uniqueMarkers[existingIdx].priority) {
          uniqueMarkers[existingIdx] = marker;
        }
      } else {
        uniqueMarkers.push(marker);
      }
    });

    return uniqueMarkers;
  }, [travelSpots, savedTrips, tempPinsData, activePinId]);

  const renderElement = (d) => {
    const el = document.createElement('div');
    el.style.position = 'absolute'; el.style.pointerEvents = 'auto';

    let iconContent = '';
    let scale = '1';
    let offsetY = '-50%'; 
    let zIndex = '10';

    // --- 1. ⭐️ Saved (Priority 4) ---
    if (d.type === 'saved-trip') {
        zIndex = '100';
        iconContent = `
            <div style="filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.5));">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            </div>`;
    }
    // --- 2. 💬 Chat (Priority 3) ---
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
    // --- 3. 📍 Active (Priority 2) ---
    else if (d.type === 'active') {
        zIndex = '200';
        scale = '1.2';
        offsetY = '-100%'; 
        iconContent = `
            <div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); animation: pinBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1;">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#991b1b"/>
                </svg>
            </div>`;
    }
    // --- 4. 👻 Ghost (Priority 1) ---
    else if (d.type === 'ghost') {
        zIndex = '50';
        offsetY = '-100%';
        scale = '0.7'; 
        iconContent = `
            <div style="opacity: 0.7; filter: grayscale(40%);">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#991b1b"/>
                </svg>
            </div>`;
    }
    // --- 5. Major (Priority 0) ---
    else {
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

    el.innerHTML = `
      <div style="position: absolute; transform: translate(-50%, ${offsetY}); cursor: pointer; transition: transform 0.2s ease;">
        <div style="transform: scale(${scale});">${iconContent}</div>
      </div>
      <style>
        @keyframes pinBounce {
          0% { transform: translateY(-50px); opacity: 0; }
          60% { transform: translateY(10px); opacity: 1; }
          80% { transform: translateY(-5px); }
          100% { transform: translateY(0); }
        }
      </style>
    `;

    el.onclick = (e) => { 
      e.stopPropagation(); 
      if (onMarkerClick) onMarkerClick(d, 'globe'); 
    };
    
    // 🚨 [Fix] Hover Lock 활성화/비활성화
    el.onmouseenter = () => { 
      isHoveringMarker.current = true; // 🔒 Lock: 지구본 클릭 차단
      el.querySelector('div').style.transform = `translate(-50%, ${offsetY}) scale(1.5)`; 
    };
    el.onmouseleave = () => { 
      isHoveringMarker.current = false; // 🔓 Unlock: 지구본 클릭 허용
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