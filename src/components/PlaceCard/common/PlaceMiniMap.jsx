import React, { useRef, useEffect, useState } from 'react';
import Map, { Marker, NavigationControl, Source } from 'react-map-gl/mapbox';
import { Mountain, Map as MapIcon } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const PlaceMiniMap = ({ lat, lng, name }) => {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const [is3D, setIs3D] = useState(true);

    // Mapbox 토큰 (환경 변수에서 가져오기)
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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
            className="w-full h-96 md:h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-lg relative z-10 mb-8 animate-fade-in group"
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
                style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
                mapStyle="mapbox://styles/mapbox/outdoors-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
                attributionControl={false}
                terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
                onLoad={onMapLoad}
                scrollZoom={false}
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
                    <div className="w-5 h-5 bg-blue-500 rounded-full border-3 border-white shadow-2xl animate-pulse relative">
                        {/* 외곽 링 효과 */}
                        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
                    </div>
                </Marker>

                {/* 네비게이션 컨트롤 */}
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
