import React, { useRef, useEffect, useState } from 'react';
import Map, { Marker, NavigationControl, FullscreenControl, Source } from 'react-map-gl/mapbox';
import { Mountain, Map as MapIcon, Maximize2, Minimize2 } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const PlaceMiniMap = ({ lat, lng, name }) => {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const [is3D, setIs3D] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [supportsFullscreen, setSupportsFullscreen] = useState(false);

    // Mapbox 토큰 (환경 변수에서 가져오기)
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    // Fullscreen API 지원 여부 체크
    useEffect(() => {
        const checkFullscreenSupport = () => {
            // Fullscreen API 지원 확인
            const isSupported =
                document.fullscreenEnabled ||
                document.webkitFullscreenEnabled ||
                document.mozFullScreenEnabled ||
                document.msFullscreenEnabled;

            setSupportsFullscreen(isSupported);

            if (import.meta.env.DEV) {
                console.log('[PlaceMiniMap] Fullscreen API 지원:', isSupported);
            }
        };

        checkFullscreenSupport();
    }, []);

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.flyTo({
                center: [lng, lat],
                zoom: 12,
                pitch: is3D ? 60 : 0,
                bearing: is3D ? -20 : 0,
                duration: 2000
            });
        }
    }, [lat, lng]);

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

    // 모바일 풀스크린 토글 함수
    const toggleFullscreen = async () => {
        if (!mapContainerRef.current || !supportsFullscreen) return;

        try {
            const elem = mapContainerRef.current;

            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                // 크로스 브라우저 fullscreen API
                if (elem.requestFullscreen) {
                    await elem.requestFullscreen();
                } else if (elem.webkitRequestFullscreen) {
                    await elem.webkitRequestFullscreen(); // Safari
                } else if (elem.mozRequestFullScreen) {
                    await elem.mozRequestFullScreen(); // Firefox
                } else if (elem.msRequestFullscreen) {
                    await elem.msRequestFullscreen(); // IE/Edge
                }
                setIsFullscreen(true);
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    await document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.warn('[PlaceMiniMap] 풀스크린 전환 실패:', error);
            }
        }
    };

    // 풀스크린 상태 변경 감지
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // 지도 로드 후 처리 (맵박스 자체 지명은 유지)
    const onMapLoad = () => {
        // 맵박스 기본 지명은 표시되도록 아무 작업도 하지 않음
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
            className={`w-full h-64 md:h-96 rounded-2xl overflow-hidden border border-white/10 shadow-lg relative z-10 mb-8 animate-fade-in group ${isFullscreen ? 'fixed inset-0 w-screen h-screen rounded-none z-[300]' : ''}`}
        >
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: lng,
                    latitude: lat,
                    zoom: 12,
                    pitch: 60,
                    bearing: -20
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/outdoors-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
                attributionControl={false}
                terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
                onLoad={onMapLoad}
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
                    <div className="w-5 h-5 bg-blue-500 rounded-full border-3 border-white shadow-2xl animate-pulse relative">
                        {/* 외곽 링 효과 */}
                        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
                    </div>
                </Marker>

                {/* 편의 컨트롤들 */}
                <div className="mapboxgl-ctrl-top-right">
                    <FullscreenControl />
                </div>
                <NavigationControl position="bottom-right" showCompass={true} showZoom={true} />
            </Map>

            {/* 상단 컨트롤 버튼 그룹 */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                {/* 2D/3D 토글 버튼 */}
                <button
                    onClick={toggle3D}
                    className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-white px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 border border-white/10 shadow-lg"
                    aria-label={is3D ? '2D 뷰로 전환' : '3D 뷰로 전환'}
                >
                    {is3D ? (
                        <>
                            <Mountain size={18} className="text-emerald-400" />
                            <span className="text-xs font-bold">3D</span>
                        </>
                    ) : (
                        <>
                            <MapIcon size={18} className="text-blue-400" />
                            <span className="text-xs font-bold">2D</span>
                        </>
                    )}
                </button>

                {/* 모바일 풀스크린 버튼 (Fullscreen API 지원 시에만 표시) */}
                {supportsFullscreen && (
                    <button
                        onClick={toggleFullscreen}
                        className="md:hidden bg-black/60 backdrop-blur-md hover:bg-black/80 text-white p-2.5 rounded-xl transition-all duration-300 border border-white/10 shadow-lg"
                        aria-label={isFullscreen ? '풀스크린 종료' : '풀스크린'}
                    >
                        {isFullscreen ? (
                            <Minimize2 size={18} className="text-purple-400" />
                        ) : (
                            <Maximize2 size={18} className="text-purple-400" />
                        )}
                    </button>
                )}
            </div>

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
