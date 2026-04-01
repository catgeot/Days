import React, { useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl, FullscreenControl, ScaleControl, Source } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const PlaceMiniMap = ({ lat, lng, name }) => {
    const mapRef = useRef(null);

    // Mapbox 토큰 (환경 변수에서 가져오기)
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    useEffect(() => {
        if (mapRef.current) {
            // 3D 입체감을 위해 pitch(기울기)와 bearing(회전) 설정
            mapRef.current.flyTo({
                center: [lng, lat],
                zoom: 12, // 지형이 잘 보이도록 줌 레벨을 조금 높임
                pitch: 60, // 60도 기울임
                bearing: -20, // 약간 회전
                duration: 2000 // 부드러운 이동
            });
        }
    }, [lat, lng]);

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
                mapStyle="mapbox://styles/mapbox/outdoors-v12" // 3D 지형이 돋보이는 아웃도어 테마 적용
                mapboxAccessToken={MAPBOX_TOKEN}
                attributionControl={false}
                terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }} // 3D 지형 효과 활성화
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
                <FullscreenControl position="top-right" />
                <NavigationControl position="bottom-right" showCompass={true} />
                <ScaleControl position="bottom-left" />
            </Map>

            {/* 3D 뷰 안내 오버레이 (호버 시 사라짐) */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white/90 text-xs px-3 py-2 rounded-xl pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity duration-500 z-20 flex flex-col gap-1">
                <div className="flex items-center gap-2 font-bold">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    3D 지형 뷰 활성화됨
                </div>
                <div className="text-[10px] text-gray-300">
                    <span className="hidden md:inline">PC: 우클릭 드래그로 기울기/회전</span>
                    <span className="inline md:hidden">모바일: 두 손가락으로 드래그하여 기울기 조절</span>
                </div>
            </div>
        </div>
    );
};

export default PlaceMiniMap;
