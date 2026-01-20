import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { MAJOR_CITIES, HIDDEN_GEMS } from '../../../date/travelSpots'; 

const HomeGlobe = forwardRef(({ onGlobeClick, onMarkerClick, isChatOpen }, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  const [visibleMarkers, setVisibleMarkers] = useState(MAJOR_CITIES);
  const [userPin, setUserPin] = useState(null);

  // 🚨 [수정] 부모가 호출할 수 있는 함수들 (flyToAndPin 추가됨)
  useImperativeHandle(ref, () => ({
    pauseRotation: () => { 
      if(globeEl.current) globeEl.current.controls().autoRotate = false; 
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    },
    resumeRotation: () => { 
      if(globeEl.current) globeEl.current.controls().autoRotate = true; 
    },
    
    // 🚨 [New] 외부에서 명령을 내려서 핀을 꽂고 이동시키는 함수
    flyToAndPin: (lat, lng, name = "My Pick") => {
      // 1. 기존 타이머 정리
      if (rotationTimer.current) clearTimeout(rotationTimer.current);

      // 2. 이동 및 핀 생성
      if (globeEl.current) {
        globeEl.current.controls().autoRotate = false; 
        globeEl.current.pointOfView({ lat, lng, altitude: 2.0 }, 1500); // 1.5초 동안 부드럽게 이동
      }

      const newPin = {
        lat,
        lng,
        type: 'user-pin',
        name: name,  
        weather: 'sun',
        altitude: 0 
      };
      setUserPin(newPin);

      // 3. 3초 후 회전 재개 (Ambient)
      rotationTimer.current = setTimeout(() => {
        if (globeEl.current) globeEl.current.controls().autoRotate = true;
      }, 3000);
    }
  }));

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    };
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ altitude: 2.5 }); 
    }
  }, []);

  const handleZoom = ({ altitude }) => {
    if (altitude < 1.2) {
      setVisibleMarkers(prev => prev.length > MAJOR_CITIES.length ? prev : [...MAJOR_CITIES, ...HIDDEN_GEMS]);
    } else {
      setVisibleMarkers(prev => prev.length === MAJOR_CITIES.length ? prev : MAJOR_CITIES);
    }
  };

  // 내부 클릭 핸들러 (사용자가 직접 땅을 클릭했을 때)
  const handleGlobeClickInternal = ({ lat, lng }) => {
    if (rotationTimer.current) clearTimeout(rotationTimer.current);

    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false; 
      globeEl.current.pointOfView({ lat, lng, altitude: 2.0 }, 1000);
    }

    const newPin = { lat, lng, type: 'user-pin', name: 'My Pick', weather: 'sun', altitude: 0 };
    setUserPin(newPin);

    if (onGlobeClick) onGlobeClick({ lat, lng });

    rotationTimer.current = setTimeout(() => {
      if (globeEl.current) globeEl.current.controls().autoRotate = true;
    }, 3000);
  };

  const renderElement = (d) => {
    const el = document.createElement('div');
    el.style.width = '0px'; el.style.height = '0px'; el.style.position = 'absolute'; el.style.pointerEvents = 'auto';

    if (d.type === 'user-pin') {
      el.innerHTML = `
        <div style="position: absolute; bottom: 0; left: 0; transform: translateX(-50%); cursor: pointer; animation: dropIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 40px; line-height: 1; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); padding-bottom: 2px;">📍</div>
          <div style="background: rgba(255, 255, 255, 0.95); padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 800; color: #1e3a8a; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3); margin-bottom: 5px;">Click to Ticket</div>
        </div>
        <style>@keyframes dropIn { from { transform: translateX(-50%) translateY(-50px) scale(0); opacity: 0; } to { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; } }</style>
      `;
      el.onclick = (e) => { e.stopPropagation(); if (onMarkerClick) onMarkerClick(d); };
      return el;
    }

    const colorClass = d.weather === 'sun' ? '#FBBF24' : d.weather === 'rain' ? '#60A5FA' : '#E2E8F0'; 
    let iconSvg = ''; // SVG 코드 생략 (기존 유지)
    if (d.weather === 'sun') iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorClass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41-1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    else if (d.weather === 'rain') iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorClass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`;
    else iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorClass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/><path d="M14 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/><path d="M20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/><path d="m20 12-2-2"/><path d="m14 14-2-2"/><path d="m8 16-2-2"/></svg>`;

    const scale = d.type === 'major' ? '1' : '0.85';
    el.innerHTML = `
      <div style="position: absolute; left: 0; top: 0; transform: translate(-50%, -50%) scale(${scale}); display: flex; align-items: center; gap: 5px; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); border: 1px solid ${d.type === 'major' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)'}; padding: 3px 6px; border-radius: 99px; cursor: pointer; box-shadow: 0 0 15px rgba(0,0,0,0.6); transition: all 0.3s ease;">
        ${iconSvg}
        <span style="color: white; font-size: 10px; font-weight: ${d.type === 'major' ? 'bold' : 'normal'}; font-family: sans-serif; white-space: nowrap;">${d.name}</span>
        <span style="color: #cbd5e1; font-size: 9px; font-family: sans-serif;">${d.temp}°</span>
      </div>
      <div style="width: 1px; height: ${d.type === 'major' ? '20px' : '10px'}; background: linear-gradient(to bottom, rgba(255,255,255,0.5), transparent); margin: 0 auto; margin-top: -1px; transform: translateX(-50%);"></div>
    `;
    el.onclick = (e) => { e.stopPropagation(); onMarkerClick(`${d.country}, ${d.name}`); };
    el.onmouseenter = () => { const box = el.querySelector('div'); if(box) { box.style.transform = `translate(-50%, -50%) scale(1.1)`; box.style.borderColor = '#60A5FA'; }};
    el.onmouseleave = () => { const box = el.querySelector('div'); if(box) { box.style.transform = `translate(-50%, -50%) scale(${scale})`; box.style.borderColor = d.type === 'major' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)'; }};
    return el;
  };

  const allMarkers = useMemo(() => userPin ? [...visibleMarkers, userPin] : visibleMarkers, [visibleMarkers, userPin]);

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
        onZoom={handleZoom}
        htmlElementsData={allMarkers}
        htmlElement={renderElement}
        htmlTransitionDuration={0} 
      />
    </div>
  );
});

export default HomeGlobe;