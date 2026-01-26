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

  // 🚨 [Logic Upgrade] 매핑 보강 & 고스트 버스터
  const allMarkers = useMemo(() => {
    let result = [];
    const threshold = 0.05; 

    const findMatchIndex = (lat, lng) => 
        result.findIndex(m => Math.abs(m.lat - lat) < threshold && Math.abs(m.lng - lng) < threshold);

    // 1. Layer 1: Travel Spots (Major) - 지명 아이콘 (Base)
    travelSpots.forEach(spot => {
        result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false });
    });

    // 2. Layer 2: Saved Trips (Chat History & Bookmarks)
    savedTrips.forEach(trip => {
        const idx = findMatchIndex(trip.lat, trip.lng);
        const isBookmarked = trip.is_bookmarked;
        
        // 🚨 [Fix] 데이터 매핑 보강: 이름 정보가 없으면 destination 사용
        const fixedName = trip.name || trip.destination || "Unknown Place";
        const fixedCountry = trip.country || "Saved Location";

        if (idx !== -1) {
            // 지명과 겹치면? -> 배지(Flag)만 달아줌
            if (isBookmarked) result[idx].isBookmarked = true;
            else result[idx].hasChat = true;
            
            // ID 업데이트 (최신 인터랙션을 위해)
            result[idx].id = trip.id; 
        } else {
            // 안 겹치면? -> 독립적인 아이콘 (바다 위 별표/말풍선)
            result.push({ 
                ...trip, 
                name: fixedName, // 🚨 이름표 복구
                country: fixedCountry,
                type: isBookmarked ? 'saved-trip' : 'chat',
                priority: isBookmarked ? 4 : 3,
                isBookmarked: isBookmarked,
                hasChat: !isBookmarked
            });
        }
    });

    // 3. Layer 3: Temp Pins (Active & Ghosts)
    // 🚨 [Fix] 고스트 버스터: Active 핀 찾기
    const activePin = tempPinsData.find(p => p.id === activePinId);

    tempPinsData.forEach(pin => {
        const isActive = (pin.id === activePinId);

        // 🚨 [Fix] 고스트 제거: 만약 이 핀이 Ghost인데, Active 핀과 겹친다면? -> Skip (그리지 않음)
        if (!isActive && activePin) {
             if (Math.abs(pin.lat - activePin.lat) < threshold && Math.abs(pin.lng - activePin.lng) < threshold) {
                 return; // Active가 이미 그 자리를 차지했으므로 Ghost는 퇴장
             }
        }

        const idx = findMatchIndex(pin.lat, pin.lng);

        if (idx !== -1) {
            // 이미 뭔가(지명 or 저장됨)가 있다 -> 상태만 업데이트
            if (isActive) {
                result[idx].isActive = true;
                result[idx].isGhost = false; 
            } else {
                result[idx].isGhost = true; 
            }
        } else {
            // 아무것도 없는 빈 땅 -> 탐색 핀 생성
            result.push({ 
                ...pin, 
                type: isActive ? 'active' : 'ghost', 
                isActive: isActive,
                isGhost: !isActive 
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

    // ---------------------------------------------------------
    // A. Main Icon Content (Base)
    // ---------------------------------------------------------
    
    // 1. 독립된 별표 (Saved Trip)
    if (d.type === 'saved-trip') { 
        zIndex = '100';
        iconContent = `
            <div style="filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.5));">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            </div>`;
    }
    // 2. 독립된 말풍선 (Chat)
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
    // 3. 탐색 핀 (Active/Ghost) - 독립
    else if (d.type === 'active') { 
        zIndex = '200';
        offsetY = '-100%'; 
        iconContent = `<div style="width:1px; height:1px;"></div>`; 
    }
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
    // 4. 지명 아이콘 (Major)
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

    // ---------------------------------------------------------
    // B. Overlay (Badges & Pins)
    // ---------------------------------------------------------
    let overlay = '';
    
    // 1. Active Pin
    if (d.isActive) {
        zIndex = '999'; 
        overlay += `
            <div style="position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%); width: 32px; height: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); animation: pinBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1;">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#991b1b"/>
                </svg>
                <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid #7f1d1d;"></div>
            </div>
        `;
    }
    // 2. Ghost Pin Overlay
    else if (d.isGhost) {
        zIndex = '900'; 
        overlay += `
            <div style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); width: 24px; height: 24px; opacity: 0.85; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#991b1b"/>
                </svg>
            </div>
        `;
    }

    // 3. Status Badge (우측 하단 배지)
    // Major 아이콘이면서, 북마크나 채팅 내역이 있는 경우
    if (d.type === 'major') {
        if (d.isBookmarked) {
            overlay += `
                <div style="position: absolute; bottom: 18px; right: -10px; width: 18px; height: 18px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5)); animation: popIn 0.3s ease-out;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fbbf24" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                </div>`;
        } else if (d.hasChat) {
            overlay += `
                <div style="position: absolute; bottom: 18px; right: -10px; width: 18px; height: 18px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5)); animation: popIn 0.3s ease-out;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>`;
        }
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
        @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            80% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); }
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