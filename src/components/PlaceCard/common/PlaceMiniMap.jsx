import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet 기본 마커 아이콘 경로 문제 해결
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconRetinaUrl: iconRetina,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// 위치가 변경될 때 지도의 중심을 이동시키는 내부 컴포넌트
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const PlaceMiniMap = ({ lat, lng, name }) => {
    if (!lat || !lng) return null;

    const position = [lat, lng];

    return (
        <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden border border-white/10 shadow-lg relative z-10 mb-8 animate-fade-in">
            <MapContainer
                center={position}
                zoom={10}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', background: '#1a1a1a', zIndex: 1 }}
                attributionControl={false}
            >
                {/* 다크 테마 타일 서버 (CartoDB Dark Matter) */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={position}>
                    <Popup>
                        <span className="font-bold text-gray-200">{name}</span>
                    </Popup>
                </Marker>
                <MapUpdater center={position} />
            </MapContainer>

            {/* 다크 테마에 맞춘 팝업 및 컨트롤 스타일 커스터마이징 */}
            <style>{`
                .leaflet-popup-content-wrapper {
                    background: rgba(20, 20, 20, 0.95) !important;
                    color: white !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important;
                }
                .leaflet-popup-tip {
                    background: rgba(20, 20, 20, 0.95) !important;
                    border-bottom: 1px solid rgba(255,255,255,0.1) !important;
                    border-right: 1px solid rgba(255,255,255,0.1) !important;
                }
                .leaflet-container a.leaflet-popup-close-button {
                    color: #9ca3af !important;
                    padding: 4px 8px !important;
                }
                .leaflet-control-container .leaflet-control-zoom {
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 8px !important;
                    overflow: hidden !important;
                }
                .leaflet-control-container .leaflet-control-zoom a {
                    background: rgba(20, 20, 20, 0.8) !important;
                    color: white !important;
                    border-bottom: 1px solid rgba(255,255,255,0.1) !important;
                }
                .leaflet-control-container .leaflet-control-zoom a:hover {
                    background: rgba(40, 40, 40, 0.9) !important;
                }
            `}</style>
        </div>
    );
};

export default PlaceMiniMap;
