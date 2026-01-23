// src/pages/Home/components/HomeGlobe.jsx
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { MAJOR_CITIES } from '../../../date/travelSpots'; // 🚨 경로 확인 필요 (date -> data 오타 수정 권장)

const HomeGlobe = forwardRef(({ onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [], tempPinsData = [] }, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  
  // 기본 마커들 (주요 도시)
  const [visibleMarkers] = useState(MAJOR_CITIES); 
  // 내부적으로 찍는 임시 핀 (시각적 피드백용)
  const [tempPins, setTempPins] = useState([]);

  // 부모(Home)에서 tempPinsData가 바뀌면 반영
  useEffect(() => {
    if (tempPinsData) {
      const formattedPins = tempPinsData.map(pin => ({
        ...pin,
        type: 'user-pin',
        weather: 'sun'
      }));
      setTempPins(formattedPins);
    }
  }, [tempPinsData]);

  // 부모(Home)가 호출할 수 있는 함수들
  useImperativeHandle(ref, () => ({
    pauseRotation: () => { 
      if(globeEl.current) globeEl.current.controls().autoRotate = false; 
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    },
    resumeRotation: () => { 
      if(globeEl.current) globeEl.current.controls().autoRotate = true; 
    },
    flyToAndPin: (lat, lng, name = "Selected") => {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
      if (globeEl.current) {
        globeEl.current.controls().autoRotate = false; 
        globeEl.current.pointOfView({ lat, lng, altitude: 2.0 }, 1500);
      }
      
      const visualPin = { 
        lat, lng, type: 'user-pin', name: name, weather: 'sun', id: Date.now() 
      };
      setTempPins(prev => [...prev, visualPin]);
      
      rotationTimer.current = setTimeout(() => {
        if (globeEl.current) globeEl.current.controls().autoRotate = true;
      }, 3000);
    },
    updateLastPinName: (newName) => {
       setTempPins(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], name: newName };
        return updated;
      });
    },
    resetPins: () => { setTempPins([]); }
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

  // 🚨 [핵심] 지도 클릭 시: 내부적으로 핀만 찍고, 부모에게 "클릭됨" 보고만 함
  const handleGlobeClickInternal = ({ lat, lng }) => {
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    if (globeEl.current) globeEl.current.controls().autoRotate = false; 
    globeEl.current.pointOfView({ lat, lng, altitude: 2.0 }, 1000);
    
    // "Selecting..." 이라는 핀을 시각적으로만 찍음 (부모가 나중에 이름을 업데이트 해줄 것임)
    const newPin = { lat, lng, type: 'user-pin', name: 'Selecting...', weather: 'sun', id: Date.now() };
    setTempPins(prev => [...prev, newPin]);

    // 부모에게 보고
    if (onGlobeClick) onGlobeClick({ lat, lng });

    rotationTimer.current = setTimeout(() => {
      if (globeEl.current) globeEl.current.controls().autoRotate = true;
    }, 3000);
  };

  const allMarkers = useMemo(() => {
    const savedMarkers = savedTrips.map(trip => ({
      lat: trip.lat, lng: trip.lng, name: trip.destination, weather: 'sun', type: 'saved-trip', id: trip.id
    }));
    return [...visibleMarkers, ...savedMarkers, ...tempPins];
  }, [visibleMarkers, savedTrips, tempPins]);

  const renderElement = (d) => {
    const el = document.createElement('div');
    el.style.width = '0px'; el.style.height = '0px'; el.style.position = 'absolute'; el.style.pointerEvents = 'auto';

    const isUserAction = d.type === 'user-pin' || d.type === 'saved-trip';
    const colorClass = isUserAction ? '#EF4444' : (d.type === 'hidden' ? '#FBBF24' : '#3B82F6');
    const borderStyle = isUserAction ? '1px solid #EF4444' : (d.type === 'hidden' ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(59, 130, 246, 0.5)');
    const bgStyle = 'rgba(0, 0, 0, 0.8)';
    const scale = d.type === 'major' ? '1' : '0.9';
    const zIndex = isUserAction ? '100' : '10'; // 🚨 내 핀이 제일 위에 오도록
    el.style.zIndex = zIndex;

    let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorClass}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41-1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

    el.innerHTML = `
      <div style="
        position: absolute; transform: translate(-50%, -50%) scale(${scale}); 
        display: flex; align-items: center; gap: 4px; 
        background: ${bgStyle}; backdrop-filter: blur(4px); 
        border: ${borderStyle}; padding: 3px 8px; border-radius: 99px; 
        cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.6); 
        transition: all 0.2s ease;">
        ${iconSvg}
        <span style="color: white; font-size: 11px; font-weight: bold; font-family: sans-serif; white-space: nowrap;">${d.name}</span>
      </div>
      <div style="width: 1px; height: 15px; background: linear-gradient(to bottom, ${colorClass}, transparent); margin: 0 auto; margin-top: -1px; transform: translateX(-50%);"></div>
    `;

    // 🚨 마커 클릭 시
    el.onclick = (e) => { 
      e.stopPropagation(); // 지도 클릭 이벤트가 발생하지 않도록 막음
      if (onMarkerClick) onMarkerClick(d, 'globe'); // 부모에게 "마커가 클릭됨" 보고
    };
    
    el.onpointerdown = (e) => e.stopPropagation(); 
    el.onmouseenter = () => { 
        const box = el.querySelector('div'); 
        if(box) {
            box.style.transform = `translate(-50%, -50%) scale(1.1)`;
            box.style.background = isUserAction ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
        }
    };
    el.onmouseleave = () => { 
        const box = el.querySelector('div'); 
        if(box) {
            box.style.transform = `translate(-50%, -50%) scale(${scale})`;
            box.style.background = bgStyle;
        }
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
        htmlElementsData={allMarkers}
        htmlElement={renderElement}
        htmlTransitionDuration={0} 
      />
    </div>
  );
});

export default HomeGlobe;