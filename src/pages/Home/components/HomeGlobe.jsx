import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Globe from 'react-globe.gl';
import { MAJOR_CITIES, HIDDEN_GEMS } from '../../../date/travelSpots'; // 데이터 불러오기

const HomeGlobe = forwardRef(({ onGlobeClick, onMarkerClick, isChatOpen }, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [visibleMarkers, setVisibleMarkers] = useState(MAJOR_CITIES);

  // 부모(Home)에서 지구본을 제어할 수 있게 ref 연결
  useImperativeHandle(ref, () => ({
    pauseRotation: () => { if(globeEl.current) globeEl.current.controls().autoRotate = false; },
    resumeRotation: () => { if(globeEl.current) globeEl.current.controls().autoRotate = true; }
  }));

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ altitude: 2.5 }); 
    }
  }, []);

  // 줌 레벨에 따른 마커 필터링 (LOD)
  const handleZoom = ({ altitude }) => {
    if (altitude < 1.2) {
      setVisibleMarkers(prev => prev.length > MAJOR_CITIES.length ? prev : [...MAJOR_CITIES, ...HIDDEN_GEMS]);
    } else {
      setVisibleMarkers(prev => prev.length === MAJOR_CITIES.length ? prev : MAJOR_CITIES);
    }
  };

  // 마커 디자인 (HTML)
  const renderWeatherMarker = (d) => {
    const el = document.createElement('div');
    const colorClass = d.weather === 'sun' ? '#FBBF24' : d.weather === 'rain' ? '#60A5FA' : '#E2E8F0'; 
    let iconSvg = '';
    
    // (아이콘 SVG 코드는 길이상 간략화 - 이전과 동일)
    if (d.weather === 'sun') iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorClass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41-1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    else if (d.weather === 'rain') iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorClass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`;
    else iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${colorClass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/><path d="M14 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/><path d="M20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/><path d="m20 12-2-2"/><path d="m14 14-2-2"/><path d="m8 16-2-2"/></svg>`;

    const scale = d.type === 'major' ? '1' : '0.85';
    const opacity = d.type === 'major' ? '1' : '0.9';

    el.innerHTML = `
      <div style="display: flex; align-items: center; gap: 5px; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); border: 1px solid ${d.type === 'major' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)'}; padding: 3px 6px; border-radius: 99px; cursor: pointer; transform: translate(-50%, -50%) scale(${scale}); opacity: ${opacity}; box-shadow: 0 0 15px rgba(0,0,0,0.6); pointer-events: auto; transition: all 0.3s ease;">
        ${iconSvg}
        <span style="color: white; font-size: 10px; font-weight: ${d.type === 'major' ? 'bold' : 'normal'}; font-family: sans-serif; white-space: nowrap;">${d.name}</span>
        <span style="color: #cbd5e1; font-size: 9px; font-family: sans-serif;">${d.temp}°</span>
      </div>
      <div style="width: 1px; height: ${d.type === 'major' ? '20px' : '10px'}; background: linear-gradient(to bottom, rgba(255,255,255,0.5), transparent); margin: 0 auto; margin-top: -1px;"></div>
    `;

    el.onclick = (e) => {
      e.stopPropagation(); // 부모 클릭 방지
      onMarkerClick(`${d.country}, ${d.name}`);
    };
    
    // Hover Effects
    el.onmouseenter = () => { el.querySelector('div').style.transform = `translate(-50%, -50%) scale(1.1)`; el.querySelector('div').style.borderColor = '#60A5FA'; };
    el.onmouseleave = () => { el.querySelector('div').style.transform = `translate(-50%, -50%) scale(${scale})`; el.querySelector('div').style.borderColor = d.type === 'major' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)'; };

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
        onGlobeClick={onGlobeClick}
        onZoom={handleZoom}
        htmlElementsData={visibleMarkers}
        htmlElement={renderWeatherMarker}
        htmlTransitionDuration={500} 
      />
    </div>
  );
});

export default HomeGlobe;