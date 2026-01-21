import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { MAJOR_CITIES, HIDDEN_GEMS } from '../../../date/travelSpots'; 

// 거리 계산 (중복 핀 방지용)
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

const HomeGlobe = forwardRef(({ onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [] }, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  const [visibleMarkers, setVisibleMarkers] = useState(MAJOR_CITIES);
  
  // 🚨 [수정] 단일 객체가 아니라 '배열'로 변경하여 흔적을 남김
  const [tempPins, setTempPins] = useState([]);

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
      
      // 🚨 [수정] 중복 체크 후 배열에 추가
      const isDuplicate = tempPins.some(pin => getDistanceFromLatLonInKm(pin.lat, pin.lng, lat, lng) < 50);
      if (!isDuplicate) {
        const newPin = { lat, lng, type: 'user-pin', name: name, weather: 'sun', id: Date.now() };
        setTempPins(prev => {
          const updated = [...prev, newPin];
          return updated.length > 10 ? updated.slice(updated.length - 10) : updated;
        });
      }

      rotationTimer.current = setTimeout(() => {
        if (globeEl.current) globeEl.current.controls().autoRotate = true;
      }, 3000);
    },

    // 🚨 [수정] 마지막 핀(방금 찍은 핀)의 이름 업데이트
    updateLastPinName: (newName) => {
      setTempPins(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], name: newName };
        return updated;
      });
    }
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
    
    // 🚨 [수정] 클릭 시에도 배열에 추가
    const isDuplicate = tempPins.some(pin => getDistanceFromLatLonInKm(pin.lat, pin.lng, lat, lng) < 50);
    if (!isDuplicate) {
      const newPin = { lat, lng, type: 'user-pin', name: 'Selecting...', weather: 'sun', id: Date.now() };
      setTempPins(prev => {
        const updated = [...prev, newPin];
        return updated.length > 10 ? updated.slice(updated.length - 10) : updated;
      });
    }

    if (onGlobeClick) onGlobeClick({ lat, lng });

    rotationTimer.current = setTimeout(() => {
      if (globeEl.current) globeEl.current.controls().autoRotate = true;
    }, 3000);
  };

  // 🚨 [수정] 렌더링할 마커 합치기 (기존 도시 + 저장된 여행 + 내가 찍은 흔적들)
  const allMarkers = useMemo(() => {
    // 저장된 여행지
    const savedMarkers = savedTrips.map(trip => ({
      lat: trip.lat, lng: trip.lng, name: trip.destination, weather: 'sun', type: 'saved-trip', id: trip.id
    }));
    
    // 내가 찍은 핀들 (저장된 것과 겹치면 제외하는 로직을 넣을 수도 있지만, 일단 다 보여줌)
    return [...visibleMarkers, ...savedMarkers, ...tempPins];
  }, [visibleMarkers, savedTrips, tempPins]);


  const renderElement = (d) => {
    const el = document.createElement('div');
    el.style.width = '0px'; el.style.height = '0px'; el.style.position = 'absolute'; el.style.pointerEvents = 'auto';

    const isMyPin = d.type === 'user-pin' || d.type === 'saved-trip';
    const colorClass = isMyPin ? '#60A5FA' : (d.weather === 'rain' ? '#60A5FA' : '#FBBF24');
    
    let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorClass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41-1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

    const borderStyle = isMyPin ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.3)';
    const bgStyle = 'rgba(0, 0, 0, 0.7)';
    const scale = d.type === 'major' ? '1' : '0.9';

    el.innerHTML = `
      <div style="
        position: absolute; transform: translate(-50%, -50%) scale(${scale}); 
        display: flex; align-items: center; gap: 4px; 
        background: ${bgStyle}; backdrop-filter: blur(4px); 
        border: ${borderStyle}; padding: 3px 8px; border-radius: 99px; 
        cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.5); 
        transition: all 0.2s ease;">
        ${iconSvg}
        <span style="color: white; font-size: 11px; font-weight: bold; font-family: sans-serif; white-space: nowrap;">${d.name}</span>
      </div>
      <div style="width: 1px; height: 15px; background: linear-gradient(to bottom, ${isMyPin ? '#3b82f6' : 'rgba(255,255,255,0.5)'}, transparent); margin: 0 auto; margin-top: -1px; transform: translateX(-50%);"></div>
    `;

    el.onclick = (e) => {
      e.stopPropagation(); 
      if (onMarkerClick) onMarkerClick(d);
    };
    el.onpointerdown = (e) => e.stopPropagation(); 
    el.onmouseenter = () => { const box = el.querySelector('div'); if(box) box.style.transform = `translate(-50%, -50%) scale(1.1)`; };
    el.onmouseleave = () => { const box = el.querySelector('div'); if(box) box.style.transform = `translate(-50%, -50%) scale(${scale})`; };

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