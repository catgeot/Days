import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { MAJOR_CITIES, HIDDEN_GEMS } from '../../../date/travelSpots'; 

// 거리 계산 함수 (km 단위)
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

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

const HomeGlobe = forwardRef(({ onGlobeClick, onMarkerClick, isChatOpen }, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  const [visibleMarkers, setVisibleMarkers] = useState(MAJOR_CITIES);
  const [userPins, setUserPins] = useState([]);

  useImperativeHandle(ref, () => ({
    pauseRotation: () => { 
      if(globeEl.current) globeEl.current.controls().autoRotate = false; 
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    },
    resumeRotation: () => { 
      if(globeEl.current) globeEl.current.controls().autoRotate = true; 
    },
    
    // 외부 명령 (FlyTo)
    flyToAndPin: (lat, lng, name = "Selected") => {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);

      if (globeEl.current) {
        globeEl.current.controls().autoRotate = false; 
        globeEl.current.pointOfView({ lat, lng, altitude: 2.0 }, 1500);
      }

      const isDuplicate = userPins.some(pin => getDistanceFromLatLonInKm(pin.lat, pin.lng, lat, lng) < 50);

      if (!isDuplicate) {
        const newPin = { lat, lng, type: 'user-pin', name: name, weather: 'sun', altitude: 0, id: Date.now() };
        setUserPins(prev => {
          const updated = [...prev, newPin];
          return updated.length > 10 ? updated.slice(updated.length - 10) : updated;
        });
      }

      rotationTimer.current = setTimeout(() => {
        if (globeEl.current) globeEl.current.controls().autoRotate = true;
      }, 3000);
    },

    // 🚨 [신규] 방금 꽂은 핀의 이름 업데이트 (주소 변환 후 호출됨)
    updateLastPinName: (newName) => {
      setUserPins(prev => {
        if (prev.length === 0) return prev;
        const pins = [...prev];
        // 마지막 핀의 이름을 변경
        pins[pins.length - 1] = { ...pins[pins.length - 1], name: newName };
        return pins;
      });
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

  const handleGlobeClickInternal = ({ lat, lng }) => {
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    if (globeEl.current) globeEl.current.controls().autoRotate = false; 
    
    globeEl.current.pointOfView({ lat, lng, altitude: 2.0 }, 1000);

    const isDuplicate = userPins.some(pin => getDistanceFromLatLonInKm(pin.lat, pin.lng, lat, lng) < 50);

    if (!isDuplicate) {
        // 🚨 처음엔 "New Journey"로 생성 (나중에 updateLastPinName으로 바뀜)
        const newPin = { lat, lng, type: 'user-pin', name: 'New Journey', weather: 'sun', altitude: 0, id: Date.now() };
        setUserPins(prev => {
          const updated = [...prev, newPin];
          return updated.length > 10 ? updated.slice(updated.length - 10) : updated;
        });
    }

    if (onGlobeClick) onGlobeClick({ lat, lng });

    rotationTimer.current = setTimeout(() => {
      if (globeEl.current) globeEl.current.controls().autoRotate = true;
    }, 3000);
  };

  const renderElement = (d) => {
    const el = document.createElement('div');
    el.style.width = '0px'; el.style.height = '0px'; el.style.position = 'absolute'; el.style.pointerEvents = 'auto';

    const isUserPin = d.type === 'user-pin';
    const colorClass = isUserPin ? '#60A5FA' : (d.weather === 'sun' ? '#FBBF24' : d.weather === 'rain' ? '#60A5FA' : '#E2E8F0'); 
    
    let iconSvg = ''; 
    if (d.weather === 'sun' || isUserPin) iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorClass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41-1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    else if (d.weather === 'rain') iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorClass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`;
    else iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorClass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/><path d="M14 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/><path d="M20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/><path d="m20 12-2-2"/><path d="m14 14-2-2"/><path d="m8 16-2-2"/></svg>`;

    const scale = d.type === 'major' || isUserPin ? '1' : '0.85';
    const borderStyle = isUserPin ? '1px solid #3b82f6' : `1px solid ${d.type === 'major' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`;
    const shadowStyle = isUserPin ? '0 0 15px rgba(59, 130, 246, 0.6)' : '0 0 15px rgba(0,0,0,0.6)';
    const labelColor = isUserPin ? '#bfdbfe' : 'white'; 
    const labelFontWeight = isUserPin ? '800' : (d.type === 'major' ? 'bold' : 'normal');

    el.innerHTML = `
      <div style="position: absolute; left: 0; top: 0; transform: translate(-50%, -50%) scale(${scale}); display: flex; align-items: center; gap: 5px; 
          background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); 
          border: ${borderStyle}; 
          padding: 3px 6px; border-radius: 99px; cursor: pointer; 
          box-shadow: ${shadowStyle}; 
          transition: all 0.3s ease;">
        ${iconSvg}
        <span style="color: ${labelColor}; font-size: 10px; font-weight: ${labelFontWeight}; font-family: sans-serif; white-space: nowrap;">${d.name}</span>
        <span style="color: #cbd5e1; font-size: 9px; font-family: sans-serif;">${d.temp}°</span>
      </div>
      <div style="width: 1px; height: ${d.type === 'major' || isUserPin ? '20px' : '10px'}; background: linear-gradient(to bottom, ${isUserPin ? '#3b82f6' : 'rgba(255,255,255,0.5)'}, transparent); margin: 0 auto; margin-top: -1px; transform: translateX(-50%);"></div>
    `;

    el.onclick = (e) => {
      e.stopPropagation(); 
      if (onMarkerClick) onMarkerClick(d);
    };
    
    el.onpointerdown = (e) => e.stopPropagation(); 

    el.onmouseenter = () => { const box = el.querySelector('div'); if(box) { box.style.transform = `translate(-50%, -50%) scale(1.1)`; if(!isUserPin) box.style.borderColor = '#60A5FA'; }};
    el.onmouseleave = () => { const box = el.querySelector('div'); if(box) { box.style.transform = `translate(-50%, -50%) scale(${scale})`; if(!isUserPin) box.style.borderColor = d.type === 'major' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)'; }};
    
    return el;
  };

  const allMarkers = useMemo(() => [...visibleMarkers, ...userPins], [visibleMarkers, userPins]);

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