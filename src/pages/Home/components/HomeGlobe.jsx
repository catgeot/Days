import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { MAJOR_CITIES, HIDDEN_GEMS } from '../../../date/travelSpots'; 

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; 
  var dLat = deg2rad(lat2-lat1);  
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; 
  return d;
}
function deg2rad(deg) { return deg * (Math.PI/180) }

const HomeGlobe = forwardRef(({ onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [], tempPinsData = [] }, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  const [visibleMarkers, setVisibleMarkers] = useState(MAJOR_CITIES);
  
  const [tempPins, setTempPins] = useState([]);

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

  const handleGlobeClickInternal = ({ lat, lng }) => {
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    if (globeEl.current) globeEl.current.controls().autoRotate = false; 
    globeEl.current.pointOfView({ lat, lng, altitude: 2.0 }, 1000);
    
    const newPin = { lat, lng, type: 'user-pin', name: 'Selecting...', weather: 'sun', id: Date.now() };
    setTempPins(prev => [...prev, newPin]);

    if (onGlobeClick) onGlobeClick({ lat, lng });

    rotationTimer.current = setTimeout(() => {
      if (globeEl.current) globeEl.current.controls().autoRotate = true;
    }, 3000);
  };

  const allMarkers = useMemo(() => {
    const savedMarkers = savedTrips.map(trip => ({
      lat: trip.lat, lng: trip.lng, name: trip.destination, weather: 'sun', type: 'saved-trip', id: trip.id
    }));
    // 🚨 렌더링 순서: 기존도시(Blue) -> 저장된핀(Red) -> 임시핀(Red)
    return [...visibleMarkers, ...savedMarkers, ...tempPins];
  }, [visibleMarkers, savedTrips, tempPins]);

  const renderElement = (d) => {
    const el = document.createElement('div');
    el.style.width = '0px'; el.style.height = '0px'; el.style.position = 'absolute'; el.style.pointerEvents = 'auto';

    // 🚨 [Design Change] 핀 색상 로직 변경
    // user-pin(내가 찍은거) or saved-trip(저장된거) => True
    const isUserAction = d.type === 'user-pin' || d.type === 'saved-trip';
    
    // 색상 팔레트 정의
    // User Action: #EF4444 (Red)
    // Hidden Gem: #FBBF24 (Gold)
    // System(Major): #3B82F6 (Blue)
    const colorClass = isUserAction ? '#EF4444' : (d.type === 'hidden' ? '#FBBF24' : '#3B82F6');

    // 테두리 스타일도 색상에 맞춤
    const borderStyle = isUserAction 
      ? '1px solid #EF4444' 
      : (d.type === 'hidden' ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(59, 130, 246, 0.5)');

    const bgStyle = 'rgba(0, 0, 0, 0.8)'; // 배경은 통일 (가독성)
    const scale = d.type === 'major' ? '1' : '0.9';
    
    // Z-Index: 내 핀이 항상 위에 오도록
    const zIndex = isUserAction ? '100' : '10';
    el.style.zIndex = zIndex;

    // SVG 아이콘은 동일하되 stroke 색상만 변경
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

    el.onclick = (e) => { 
      e.stopPropagation(); 
      if (onMarkerClick) onMarkerClick(d, 'globe'); 
    };
    
    el.onpointerdown = (e) => e.stopPropagation(); 
    el.onmouseenter = () => { 
        const box = el.querySelector('div'); 
        if(box) {
            box.style.transform = `translate(-50%, -50%) scale(1.1)`;
            box.style.background = isUserAction ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'; // 호버 시 배경색 틴트
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