import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { getMarkerDesign } from '../data/markers';
import { tripHasPersistedDialogue } from '../lib/tripChatUtils';
import { getCategoryGlobeFaceView, GLOBE_FACE_FLY_MS, resolveCategoryFaceLegacyAltitude } from '../lib/globeCategoryFocus';

const GLOBE_CAMERA_CONFIG = {
  DEFAULT_ALT: 2.5,
  ZOOM_THRESHOLD: 2.2,
  AUTO_ROTATE_DISABLE_ALT: 2.0,
  FLY_TARGET_ALT: 2.1,
  FLY_DISABLE_ALT: 1.8,
  /** 「이 지역 보기」— 낮을수록 확대 (Mapbox immerseZoom 8.5 시가지) */
  IMMERSE_ALT: 0.18,
  FLY_DURATION: 3000,
  IMMERSE_DURATION: 1200,
  IDLE_DELAY_ZOOMED_OUT: 4000,
  /** 플라이 완료 후 자전 재개 여유 (카드 오픈 지향) */
  ORIENT_ROTATE_PAUSE: 2800,
  AUTO_ROTATE_SPEED: 0.5,
  LABEL_RESOLUTION: 2
};

const HomeGlobe = React.memo(forwardRef(({
  onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [],
  tempPinsData = [],
  travelSpots = [],
  activePinId,
  pauseRender = false,
  globeTheme = 'deep',
  isZenMode = false,
  highlightCategory = null,
  categoryFaceEpoch = 0
}, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  const immerseActiveRef = useRef(false);
  const prevHighlightCategoryRef = useRef(null);
  const prevCategoryFaceEpochRef = useRef(categoryFaceEpoch);
  const categoryFaceFlyGenRef = useRef(0);
  const [ripples, setRipples] = useState([]);

  const isHoveringMarker = useRef(false);

  const themeConfig = useMemo(() => {
    switch(globeTheme) {
      case 'deep':
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          atmColor: "#000000",
          atmAlt: 0.00
        };
      case 'bright':
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-day.jpg",
          atmColor: "#ffffff",
          atmAlt: 0.3
        };
      case 'neon':
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          atmColor: "#00ffff",
          atmAlt: 0.25
        };
      default:
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          atmColor: "#000000",
          atmAlt: 0.00
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
      if (pauseRender || immerseActiveRef.current) return;
      if(globeEl.current) globeEl.current.controls().autoRotate = true;
    },
    wakeAfterOverlay: () => {
      // Legacy three.js globe — no Mapbox resize; keep API parity with Adapter.
    },
    flyToAndPin: (lat, lng, _name, _category, _options) => {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
      immerseActiveRef.current = false;

      if (globeEl.current) {
        globeEl.current.controls().autoRotate = false;

        const targetAlt = GLOBE_CAMERA_CONFIG.FLY_TARGET_ALT;

        globeEl.current.pointOfView({ lat, lng, altitude: targetAlt }, GLOBE_CAMERA_CONFIG.FLY_DURATION);

        const newRipple = { lat, lng, maxR: 8, propagationSpeed: 3, repeatPeriod: 800 };
        setRipples(prev => [...prev, newRipple]);
        setTimeout(() => setRipples(prev => prev.filter(r => r !== newRipple)), 2000);

        const totalWaitTime = GLOBE_CAMERA_CONFIG.FLY_DURATION + GLOBE_CAMERA_CONFIG.ORIENT_ROTATE_PAUSE;
        rotationTimer.current = setTimeout(() => {
          if (immerseActiveRef.current) return;
          const checkAlt = globeEl.current ? globeEl.current.pointOfView().altitude : 99;
          if (globeEl.current && !pauseRender && checkAlt > GLOBE_CAMERA_CONFIG.AUTO_ROTATE_DISABLE_ALT) {
             globeEl.current.controls().autoRotate = true;
          }
        }, totalWaitTime);
      }
    },
    immerseToPin: (lat, lng) => {
      if (!globeEl.current || !Number.isFinite(lat) || !Number.isFinite(lng)) return false;
      if (rotationTimer.current) {
        clearTimeout(rotationTimer.current);
        rotationTimer.current = null;
      }
      immerseActiveRef.current = true;
      globeEl.current.controls().autoRotate = false;
      globeEl.current.pointOfView(
        { lat, lng, altitude: GLOBE_CAMERA_CONFIG.IMMERSE_ALT },
        GLOBE_CAMERA_CONFIG.IMMERSE_DURATION
      );
      return true;
    },
    exitImmerse: (lat, lng) => {
      if (!globeEl.current) return false;
      const wasImmersed = immerseActiveRef.current;
      immerseActiveRef.current = false;
      const alt = globeEl.current.pointOfView().altitude;
      if (!wasImmersed && alt > GLOBE_CAMERA_CONFIG.IMMERSE_ALT + 0.15) return false;

      if (rotationTimer.current) {
        clearTimeout(rotationTimer.current);
        rotationTimer.current = null;
      }
      globeEl.current.controls().autoRotate = false;
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
      const pov = hasCoords
        ? { lat, lng, altitude: GLOBE_CAMERA_CONFIG.FLY_TARGET_ALT }
        : { altitude: GLOBE_CAMERA_CONFIG.FLY_TARGET_ALT };
      globeEl.current.pointOfView(pov, GLOBE_CAMERA_CONFIG.FLY_DURATION);
      rotationTimer.current = setTimeout(() => {
        if (immerseActiveRef.current || !globeEl.current) return;
        const checkAlt = globeEl.current.pointOfView().altitude;
        if (!pauseRender && checkAlt > GLOBE_CAMERA_CONFIG.AUTO_ROTATE_DISABLE_ALT) {
          globeEl.current.controls().autoRotate = true;
        }
      }, GLOBE_CAMERA_CONFIG.FLY_DURATION + GLOBE_CAMERA_CONFIG.ORIENT_ROTATE_PAUSE);
      return true;
    },
    clearImmerseState: () => {
      immerseActiveRef.current = false;
    },
    isImmersed: () => Boolean(immerseActiveRef.current),
    updateLastPinName: () => {},
    triggerRipple: (lat, lng) => {
      const newRipple = { lat, lng, maxR: 5, propagationSpeed: 4, repeatPeriod: 500 };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => setRipples(prev => prev.filter(r => r !== newRipple)), 1500);
    },
    resetPins: () => {
        immerseActiveRef.current = false;
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
    if (!globeEl.current || !globeEl.current.controls) return;
    const controls = globeEl.current.controls();
    if (!controls) return;

    try {
      const R = globeEl.current.getGlobeRadius();
      controls.minDistance = R * 1.01;
    } catch {
      controls.minDistance = 101;
    }
  }, [dimensions.width, pauseRender]);

  useEffect(() => {
    const initCameraListener = () => {
      if (!globeEl.current || !globeEl.current.controls) return;
      const controls = globeEl.current.controls();
      if (!controls) return;

      const handleCameraChange = () => {
        if (!globeEl.current) return;
        const alt = globeEl.current.pointOfView().altitude;

        if (!pauseRender && globeEl.current.controls) {
          if (immerseActiveRef.current || alt <= GLOBE_CAMERA_CONFIG.AUTO_ROTATE_DISABLE_ALT) {
            globeEl.current.controls().autoRotate = false;
          } else {
            globeEl.current.controls().autoRotate = true;
          }
        }
      };

      controls.addEventListener('change', handleCameraChange);
      return () => controls.removeEventListener('change', handleCameraChange);
    };

    const timeoutId = setTimeout(initCameraListener, 500);
    return () => clearTimeout(timeoutId);
  }, [pauseRender]);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = !pauseRender;
      globeEl.current.controls().autoRotateSpeed = isZenMode ? 0.3 : GLOBE_CAMERA_CONFIG.AUTO_ROTATE_SPEED;
      if (pauseRender && rotationTimer.current) clearTimeout(rotationTimer.current);
    }
  }, [pauseRender, isZenMode]);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = !pauseRender;
      globeEl.current.controls().autoRotateSpeed = GLOBE_CAMERA_CONFIG.AUTO_ROTATE_SPEED;
      globeEl.current.pointOfView({ altitude: GLOBE_CAMERA_CONFIG.DEFAULT_ALT });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only default POV; pauseRender/zen use separate effects
  }, []);

  const handleGlobeClickInternal = ({ lat, lng }) => {
    isHoveringMarker.current = false;
    if (isZenMode) return;
    if (pauseRender) return;
    if (onGlobeClick) onGlobeClick({ lat, lng });
  };

  const allMarkers = useMemo(() => {
    let result = [];
    const threshold = 0.05;
    const findMatchIndex = (lat, lng) => result.findIndex(m => Math.abs(m.lat - lat) < threshold && Math.abs(m.lng - lng) < threshold);

    // Mapbox와 동일: 카테고리·showOnGlobe 구분 없이 전체 여행지 후보 (줌·충돌 정책은 Mapbox 쪽에서 처리)
    travelSpots.forEach(spot => { result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false }); });

    let chatCount = 0;
    savedTrips.forEach(trip => {
        const isBookmarked = trip.is_bookmarked;
        const hasMessageChat = tripHasPersistedDialogue(trip);
        if (!isBookmarked && !hasMessageChat) return;
        if (hasMessageChat && !isBookmarked) {
          if (chatCount >= 5) return;
          chatCount++;
        }
        const idx = findMatchIndex(trip.lat, trip.lng);
        const fixedName = trip.name || trip.destination || "Saved Place";

        if (idx !== -1) {
            if (isBookmarked) result[idx].isBookmarked = true;
            if (hasMessageChat) result[idx].hasChat = true;
            result[idx].tripId = trip.id;
        } else {
            result.push({
                ...trip,
                name: fixedName,
                type: 'temp-base',
                priority: isBookmarked ? 4 : 3,
                isBookmarked: isBookmarked,
                hasChat: hasMessageChat
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

  useEffect(() => {
    if (pauseRender || isZenMode || !highlightCategory || !globeEl.current) return;

    const categoryChanged = prevHighlightCategoryRef.current !== highlightCategory;
    const epochChanged = prevCategoryFaceEpochRef.current !== categoryFaceEpoch;
    if (!categoryChanged && !epochChanged) return;

    const focus = getCategoryGlobeFaceView(highlightCategory);
    if (!focus) {
      prevHighlightCategoryRef.current = highlightCategory;
      prevCategoryFaceEpochRef.current = categoryFaceEpoch;
      return;
    }

    const gen = categoryFaceFlyGenRef.current + 1;
    categoryFaceFlyGenRef.current = gen;
    const flyMs = GLOBE_FACE_FLY_MS;
    const currentPov = globeEl.current.pointOfView();
    const targetAlt = resolveCategoryFaceLegacyAltitude(currentPov.altitude);

    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    globeEl.current.controls().autoRotate = false;

    globeEl.current.pointOfView(
      { lat: focus.lat, lng: focus.lng, altitude: targetAlt },
      flyMs
    );

    rotationTimer.current = setTimeout(() => {
      if (categoryFaceFlyGenRef.current !== gen || !globeEl.current) return;
      const checkAlt = globeEl.current.pointOfView().altitude;
      if (!pauseRender && checkAlt > GLOBE_CAMERA_CONFIG.AUTO_ROTATE_DISABLE_ALT) {
        globeEl.current.controls().autoRotate = true;
      }
    }, flyMs + 400);

    prevHighlightCategoryRef.current = highlightCategory;
    prevCategoryFaceEpochRef.current = categoryFaceEpoch;
  }, [categoryFaceEpoch, highlightCategory, isZenMode, pauseRender]);

  const renderElement = (d) => {
    const el = document.createElement('div');
    el.className = 'globe-marker-wrapper';
    el.style.position = 'absolute';
    el.style.pointerEvents = 'auto';
    el.style.transition = 'opacity 0.4s ease';

    const { html, zIndex, offsetY } = getMarkerDesign(d);
    el.innerHTML = html;
    el.style.zIndex = zIndex;

    // 드래그와 클릭 구분 로직 (의도치 않은 클릭 방지)
    let startPos = null;
    let startTime = null;
    let moved = false;

    const handlePointerDown = (e) => {
      e.stopPropagation();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;

      if (clientX !== undefined && clientY !== undefined) {
        startPos = { x: clientX, y: clientY };
        startTime = Date.now();
        moved = false;
      }
    };

    const handlePointerMove = (e) => {
      if (!startPos) return;

      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;

      if (clientX !== undefined && clientY !== undefined) {
        const distance = Math.sqrt(
          Math.pow(clientX - startPos.x, 2) +
          Math.pow(clientY - startPos.y, 2)
        );

        // 5px 이상 이동 시 드래그로 간주
        if (distance > 5) {
          moved = true;
        }
      }
    };

    const handlePointerUp = (e) => {
      e.stopPropagation();

      if (!startPos || !startTime) {
        startPos = null;
        startTime = null;
        moved = false;
        return;
      }

      const duration = Date.now() - startTime;

      // 클릭 조건: 이동하지 않았고, 50-500ms 범위 내
      if (!moved && duration >= 50 && duration < 500) {
        if (onMarkerClick) onMarkerClick(d, { source: 'globe' });
      }

      // 초기화
      startPos = null;
      startTime = null;
      moved = false;
    };

    const handlePointerCancel = () => {
      startPos = null;
      startTime = null;
      moved = false;
    };

    // 이벤트 리스너 등록
    el.onpointerdown = handlePointerDown;
    el.onpointermove = handlePointerMove;
    el.onpointerup = handlePointerUp;
    el.onpointercancel = handlePointerCancel;
    el.onpointerleave = handlePointerCancel;

    // 호버 효과
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
      className={`absolute inset-0 z-0 touch-none transition-opacity duration-500 ${
        pauseRender ? 'pointer-events-none invisible' : isChatOpen ? 'opacity-30' : 'opacity-100'
      }`}
      onPointerDown={handleInteraction}
    >
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

        htmlElementsData={isZenMode ? [] : allMarkers}
        htmlElement={renderElement}
        htmlLat={d => {
          const offset = d._offsetLat || 0;
          const result = d.lat + offset;
          if (offset !== 0) console.log(`📌 Render ${d.name || d.name_en}: lat ${d.lat} + ${offset} = ${result}`);
          return result;
        }}
        htmlLng={d => {
          const offset = d._offsetLng || 0;
          const result = d.lng + offset;
          if (offset !== 0) console.log(`📌 Render ${d.name || d.name_en}: lng ${d.lng} + ${offset} = ${result}`);
          return result;
        }}
        htmlTransitionDuration={0}
      />
    </div>
  );
}));

export default HomeGlobe;
