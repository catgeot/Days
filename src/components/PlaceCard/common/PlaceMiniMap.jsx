import React, { useRef, useEffect, useState } from 'react';
import Map, { Marker, NavigationControl, FullscreenControl, Source } from 'react-map-gl/mapbox';
import { Mountain, Map as MapIcon } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const PlaceMiniMap = ({ lat, lng, name }) => {
    const mapRef = useRef(null);
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

    // 지도 로드 후 라벨 레이어 숨기기 (한글 포함 모든 텍스트)
    const onMapLoad = () => {
        setTimeout(() => {
            if (mapRef.current) {
                const map = mapRef.current.getMap();
                const style = map.getStyle();
                if (style && style.layers) {
                    style.layers.forEach((layer) => {
                        // symbol 타입의 모든 레이어 숨기기 (라벨, 아이콘 등)
                        if (layer.type === 'symbol') {
                            try {
                                map.setLayoutProperty(layer.id, 'visibility', 'none');
                            } catch (e) {
                                console.warn(`레이어 ${layer.id} 숨기기 실패:`, e);
                            }
                        }
                    });
                }
            }
        }, 500); // 스타일 로드 후 실행
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
        <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden border border-white/10 shadow-lg relative z-10 mb-8 animate-fade-in group">
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

                <Marker longitude={lng} latitude={lat} anchor="bottom">
                    <div className="flex flex-col items-center">
                        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 shadow-lg mb-2">
                            <span className="font-bold text-gray-800 whitespace-nowrap text-sm">{name}</span>
                        </div>
                        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                    </div>
                </Marker>

                {/* 편의 컨트롤들 */}
                <div className="mapboxgl-ctrl-top-right">
                    <FullscreenControl />
                </div>
                <NavigationControl position="bottom-right" showCompass={true} showZoom={true} />
            </Map>

            {/* 2D/3D 토글 버튼 */}
            <button
                onClick={toggle3D}
                className="absolute top-4 left-4 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white px-4 py-2.5 rounded-xl transition-all duration-300 z-20 flex items-center gap-2 border border-white/10 shadow-lg"
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
