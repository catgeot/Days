import React, { useRef, useEffect, useState } from 'react';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import { Mountain, Map as MapIcon, Maximize2, Minimize2, Play, FastForward, Layers, Building2 } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

// 3D 건물 레이어 속성
const buildingLayer = {
    id: 'add-3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 14,
    paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14,
            0,
            14.05,
            ['get', 'height']
        ],
        'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14,
            0,
            14.05,
            ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
    }
};

const MAP_STYLES = {
    outdoors: { label: '지형', url: 'mapbox://styles/mapbox/outdoors-v12' },
    satellite: { label: '위성', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
    streets: { label: '도심', url: 'mapbox://styles/mapbox/navigation-night-v1' }
};

const PlaceMiniMap = ({ lat, lng, name }) => {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const spinReqRef = useRef(null);

    const [is3D, setIs3D] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [supportsFullscreen, setSupportsFullscreen] = useState(false);

    // 맵 커스텀 옵션 상태
    const [currentStyle, setCurrentStyle] = useState('outdoors');
    const [show3DBuildings, setShow3DBuildings] = useState(false);
    const [showStyleMenu, setShowStyleMenu] = useState(false);

    // 애니메이션 상태 관리 ('idle', 'playing', 'ready')
    const [mapState, setMapState] = useState('idle');

    // Mapbox 토큰 (환경 변수에서 가져오기)
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    useEffect(() => {
        // Fullscreen API 지원 여부 확인 (크로스 브라우저)
        const isSupported =
            document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled;

        setSupportsFullscreen(!!isSupported);

        const handleFullscreenChange = () => {
            setIsFullscreen(
                !!document.fullscreenElement ||
                !!document.webkitFullscreenElement ||
                !!document.mozFullScreenElement ||
                !!document.msFullscreenElement
            );
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        // 위치가 변경되면 초기 지구본 뷰 상태로 되돌림
        if (mapRef.current) {
            mapRef.current.stop();
            mapRef.current.jumpTo({
                center: [lng - 60, Math.max(lat - 20, -80)], // 회전 효과를 위한 오프셋
                zoom: 0.5,
                pitch: 0,
                bearing: 0
            });
        }
        setMapState('idle');
    }, [lat, lng]);

    // 대기 상태(idle)일 때 지구 자전 효과
    useEffect(() => {
        let lastTime = 0;

        const spinGlobe = (timestamp) => {
            if (mapState !== 'idle' || !mapRef.current) return;

            const map = mapRef.current.getMap();
            // zoom 레벨이 낮을 때만 회전
            if (map.getZoom() < 3) {
                const center = map.getCenter();
                // 1초에 약 3도 회전 (역동적 느낌)
                let delta = 0;
                if (lastTime) delta = (timestamp - lastTime) / 1000;
                lastTime = timestamp;

                center.lng -= delta * 3;
                map.easeTo({ center, duration: 0, easing: n => n });
            }
            spinReqRef.current = requestAnimationFrame(spinGlobe);
        };

        if (mapState === 'idle') {
            spinReqRef.current = requestAnimationFrame(spinGlobe);
        } else {
            if (spinReqRef.current) cancelAnimationFrame(spinReqRef.current);
        }

        return () => {
            if (spinReqRef.current) cancelAnimationFrame(spinReqRef.current);
        };
    }, [mapState]);

    const playFlyTo = () => {
        if (!mapRef.current) return;
        setMapState('playing');

        mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 10,
            pitch: is3D ? 60 : 0,
            bearing: is3D ? -20 : 0,
            duration: 12000,
            essential: true
        });

        // 애니메이션이 끝나면 상태 변경
        mapRef.current.once('moveend', () => {
            setMapState(prev => (prev === 'playing' ? 'ready' : prev));
        });
    };

    const skipAnimation = () => {
        if (!mapRef.current) return;
        mapRef.current.stop();
        mapRef.current.jumpTo({
            center: [lng, lat],
            zoom: 10,
            pitch: is3D ? 60 : 0,
            bearing: is3D ? -20 : 0
        });
        setMapState('ready');
    };

    const handleMapInteraction = () => {
        if (mapState === 'playing') {
            if (mapRef.current) mapRef.current.stop();
            setMapState('ready');
        }
    };

    // 2D/3D 토글 함수 (카메라 각도만 변경, 지도 재호출 없음)
    const toggle3D = () => {
        if (mapRef.current) {
            const new3D = !is3D;
            setIs3D(new3D);
            mapRef.current.flyTo({
                pitch: new3D ? 60 : 0,
                bearing: new3D ? -20 : 0,
                duration: 800
            });
        }
    };

    // 크로스 브라우저 풀스크린 토글
    const toggleFullscreen = async () => {
        try {
            if (!isFullscreen) {
                const elem = mapContainerRef.current;
                if (elem.requestFullscreen) {
                    await elem.requestFullscreen();
                } else if (elem.webkitRequestFullscreen) {
                    await elem.webkitRequestFullscreen();
                } else if (elem.mozRequestFullScreen) {
                    await elem.mozRequestFullScreen();
                } else if (elem.msRequestFullscreen) {
                    await elem.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    await document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
            }
        } catch (err) {
            console.error("풀스크린 전환 중 오류 발생:", err);
        }
    };

    // 지명 한글화 함수
    const setKoreanLabels = () => {
        if (!mapRef.current) return;
        const map = mapRef.current.getMap();
        try {
            const style = map.getStyle();
            if (style && style.layers) {
                style.layers.forEach((layer) => {
                    // symbol 타입 중 텍스트를 렌더링하는 레이어의 경우 name_ko 우선 적용
                    // 단, 폰트 설정을 강제로 변경하면 견출지 오류가 발생할 수 있으므로 text-field만 조심스럽게 업데이트
                    if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
                        const currentTextField = layer.layout['text-field'];

                        // 이미 변경된 레이어인지 확인 (무한 루프 및 덮어쓰기 방지)
                        if (Array.isArray(currentTextField) && currentTextField[0] === 'coalesce') {
                            return;
                        }

                        map.setLayoutProperty(layer.id, 'text-field', [
                            'coalesce',
                            ['get', 'name_ko'],
                            ['get', 'name_en'],
                            ['get', 'name']
                        ]);
                    }
                });
            }
        } catch (e) {
            console.error("한글 지명 변환 중 오류:", e);
        }
    };

    // 지도 로드 후 처리
    const onMapLoad = () => {
        setKoreanLabels();
        if (import.meta.env.DEV) {
            console.log('[PlaceMiniMap] 지도 로드 완료');
        }
    };

    if (!lat || !lng) return null;

    if (!MAPBOX_TOKEN) {
        return (
            <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden border border-white/10 shadow-lg relative z-10 mb-8 flex items-center justify-center bg-gray-900 text-gray-400 text-sm">
                <p>Mapbox 지도를 표시하려면 .env.local 파일에 VITE_MAPBOX_TOKEN을 설정해주세요.</p>
            </div>
        );
    }

    return (
        <div
            ref={mapContainerRef}
            className="w-full h-96 md:h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-lg relative z-10 mb-8 animate-fade-in group bg-[#0b0f1c]"
        >
            {/* 오버레이 UI */}
            {mapState === 'idle' && (
                <div className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                    <button
                        onClick={playFlyTo}
                        className="w-20 h-20 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all hover:scale-110 shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                        aria-label="지도 애니메이션 재생"
                    >
                        <Play size={36} className="ml-2" fill="currentColor" />
                    </button>
                </div>
            )}

            {mapState === 'playing' && (
                <div className="absolute bottom-6 right-6 z-30 animate-fade-in">
                    <button
                        onClick={skipAnimation}
                        className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/90 px-4 py-2 rounded-full text-sm font-bold border border-white/10 transition-all shadow-lg hover:scale-105"
                    >
                        Skip <FastForward size={16} />
                    </button>
                </div>
            )}

            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: lng - 60,
                    latitude: Math.max(lat - 20, -80),
                    zoom: 0.5,
                    pitch: 0,
                    bearing: 0
                }}
                style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
                mapStyle={MAP_STYLES[currentStyle].url}
                mapboxAccessToken={MAPBOX_TOKEN}
                attributionControl={false}
                projection="globe"
                fog={{
                    range: [0.8, 8],
                    color: '#242b4b',
                    'horizon-blend': 0.5,
                    'high-color': '#161b36',
                    'space-color': '#0b0f1c',
                    'star-intensity': 0.8
                }}
                terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
                onLoad={onMapLoad}
                onStyleData={setKoreanLabels}
                onMouseDown={handleMapInteraction}
                onTouchStart={handleMapInteraction}
                onWheel={handleMapInteraction}
                scrollZoom={true}
                doubleClickZoom={true}
                touchZoomRotate={true}
                dragPan={{
                    linearity: 0.3,
                    easing: (t) => t,
                    deceleration: 2400,
                    maxSpeed: 1400
                }}
            >
                {/* 3D 지형(Terrain) 데이터 소스 */}
                <Source
                    id="mapbox-dem"
                    type="raster-dem"
                    url="mapbox://mapbox.mapbox-terrain-dem-v1"
                    tileSize={512}
                    maxzoom={14}
                />

                <Marker longitude={lng} latitude={lat} anchor="center">
                    {/* 커스텀 텍스트 라벨 제거, 파란 점만 표시 */}
                    <div className={`w-5 h-5 bg-blue-500 rounded-full border-3 border-white shadow-2xl relative transition-opacity duration-1000 ${mapState === 'idle' ? 'opacity-0' : 'opacity-100'}`}>
                        {/* 외곽 링 효과 */}
                        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
                    </div>
                </Marker>

                {/* 3D 빌딩 레이어 (토글 옵션) */}
                {show3DBuildings && <Layer {...buildingLayer} />}

                {/* 네비게이션 컨트롤 */}
                {mapState === 'ready' && (
                    <NavigationControl position="bottom-right" showCompass={true} showZoom={true} />
                )}
            </Map>

            {/* 상단 컨트롤 버튼 그룹 */}
            {mapState === 'ready' && (
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20 animate-fade-in pr-4">
                    {/* 스타일 선택 메뉴 토글 */}
                    <div className="relative">
                        <button
                            onClick={() => setShowStyleMenu(!showStyleMenu)}
                            className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-white px-3 py-1.5 rounded-xl transition-all duration-300 flex items-center gap-2 border border-white/10 shadow-lg"
                        >
                            <Layers size={16} className="text-pink-400" />
                            <span className="text-xs font-bold hidden sm:inline">{MAP_STYLES[currentStyle].label}</span>
                        </button>

                        {showStyleMenu && (
                            <div className="absolute top-full left-0 mt-2 w-32 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                                {Object.entries(MAP_STYLES).map(([key, style]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setCurrentStyle(key);
                                            setShowStyleMenu(false);
                                        }}
                                        className={`px-4 py-3 text-sm text-left transition-colors ${currentStyle === key ? 'bg-pink-500/20 text-pink-300 font-bold' : 'text-white/80 hover:bg-white/10'}`}
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3D 빌딩 토글 버튼 (도심/위성 모드 등에서 유용) */}
                    <button
                        onClick={() => setShow3DBuildings(!show3DBuildings)}
                        className={`backdrop-blur-md text-white px-3 py-1.5 rounded-xl transition-all duration-300 flex items-center gap-2 border border-white/10 shadow-lg ${show3DBuildings ? 'bg-indigo-600/80 hover:bg-indigo-500/80' : 'bg-black/60 hover:bg-black/80'}`}
                        aria-label="3D 건물 표시 토글"
                    >
                        <Building2 size={16} className={show3DBuildings ? 'text-white' : 'text-indigo-400'} />
                        <span className="text-xs font-bold hidden sm:inline">건물</span>
                    </button>

                    {/* 2D/3D 토글 버튼 */}
                <button
                    onClick={toggle3D}
                    className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-white px-3 py-1.5 rounded-xl transition-all duration-300 flex items-center gap-2 border border-white/10 shadow-lg"
                    aria-label={is3D ? '2D 뷰로 전환' : '3D 뷰로 전환'}
                >
                    {is3D ? (
                        <>
                            <Mountain size={16} className="text-emerald-400" />
                            <span className="text-xs font-bold">3D</span>
                        </>
                    ) : (
                        <>
                            <MapIcon size={16} className="text-blue-400" />
                            <span className="text-xs font-bold">2D</span>
                        </>
                    )}
                </button>
            </div>
            )}

            {/* 공통 풀스크린 토글 버튼 (우측 상단) */}
            {supportsFullscreen && mapState === 'ready' && (
                <div className="absolute top-4 right-4 z-20 animate-fade-in">
                    <button
                        onClick={toggleFullscreen}
                        className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-white p-2 rounded-xl transition-all duration-300 flex items-center justify-center border border-white/10 shadow-lg"
                        aria-label={isFullscreen ? '전체화면 종료' : '전체화면 보기'}
                    >
                        {isFullscreen ? (
                            <Minimize2 size={18} className="text-purple-400" />
                        ) : (
                            <Maximize2 size={18} className="text-purple-400" />
                        )}
                    </button>
                </div>
            )}

            {/* 지도 모드 안내 (3D 모드일 때만) */}
            {is3D && (
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white/80 text-[10px] px-3 py-2 rounded-lg pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity duration-500 z-10">
                    <span className="hidden md:inline">우클릭 드래그로 각도 조절</span>
                    <span className="inline md:hidden">두 손가락으로 각도 조절</span>
                </div>
            )}
        </div>
    );
};

export default PlaceMiniMap;
