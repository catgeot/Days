import React, { useCallback, useMemo, useState } from 'react';
import Map, { Layer, NavigationControl, Source, useControl } from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { MAPBOX_ATTRIBUTION_LINKS } from '../../data/mapboxAttribution';
import { festivalLngLat } from './koreaFestivalCorridors';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

const KR_VIEW = {
  longitude: 127.8,
  latitude: 36.2,
  zoom: 5.6,
};

const CAPTION_LINKS = MAPBOX_ATTRIBUTION_LINKS.filter(
  (item) => item.label === '© Mapbox' || item.label === '© OpenStreetMap',
);

function LanguageControl() {
  useControl(() => new MapboxLanguage({ defaultLanguage: 'ko' }));
  return null;
}

/**
 * @param {object[]} items
 * @returns {GeoJSON.FeatureCollection}
 */
function toGeoJson(items) {
  /** @type {GeoJSON.Feature[]} */
  const features = [];
  for (const item of items || []) {
    const pt = festivalLngLat(item?.mapx, item?.mapy);
    if (!pt) continue;
    features.push({
      type: 'Feature',
      properties: {
        contentId: String(item.contentId || ''),
        title: String(item.title || ''),
      },
      geometry: {
        type: 'Point',
        coordinates: [pt.lng, pt.lat],
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

/**
 * @param {{
 *   items: object[],
 *   onSelectCluster?: (payload: { count: number, lng: number, lat: number, contentIds: string[] }) => void,
 *   onSelectPoint?: (contentId: string) => void,
 *   className?: string,
 * }} props
 */
export default function KoreaFestivalMap({
  items,
  onSelectCluster,
  onSelectPoint,
  className = '',
}) {
  const [cursor, setCursor] = useState('grab');
  const geojson = useMemo(() => toGeoJson(items), [items]);
  const pointCount = geojson.features.length;

  const onClick = useCallback(
    async (e) => {
      const map = e.target;
      const feats = map.queryRenderedFeatures(e.point, {
        layers: ['korea-fest-clusters', 'korea-fest-unclustered'],
      });
      if (!feats?.length) return;
      const f = feats[0];
      if (f.layer?.id === 'korea-fest-clusters') {
        const clusterId = f.properties?.cluster_id;
        const source = map.getSource('korea-festivals');
        if (!source || clusterId == null) return;
        try {
          const leaves = await new Promise((resolve, reject) => {
            source.getClusterLeaves(clusterId, 80, 0, (err, result) => {
              if (err) reject(err);
              else resolve(result || []);
            });
          });
          const contentIds = leaves
            .map((leaf) => String(leaf?.properties?.contentId || ''))
            .filter(Boolean);
          const [lng, lat] = f.geometry?.coordinates || [];
          onSelectCluster?.({
            count: Number(f.properties?.point_count) || contentIds.length,
            lng,
            lat,
            contentIds,
          });
        } catch {
          /* ignore */
        }
        return;
      }
      const contentId = String(f.properties?.contentId || '');
      if (contentId) onSelectPoint?.(contentId);
    },
    [onSelectCluster, onSelectPoint],
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center ${className}`}
      >
        <p className="text-sm text-gray-300">지도를 표시할 수 없습니다.</p>
        <p className="mt-1 text-[11px] text-gray-500">
          권역 칩과 카드로 축제를 찾아 보세요. ({pointCount}곳 좌표)
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 ${className}`}
      style={{ height: 280 }}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={KR_VIEW}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        logoPosition="bottom-left"
        reuseMaps
        cursor={cursor}
        onMouseEnter={() => setCursor('pointer')}
        onMouseLeave={() => setCursor('grab')}
        onClick={onClick}
        interactiveLayerIds={['korea-fest-clusters', 'korea-fest-unclustered']}
      >
        <LanguageControl />
        <NavigationControl position="top-right" showCompass={false} />
        <Source
          id="korea-festivals"
          type="geojson"
          data={geojson}
          cluster
          clusterMaxZoom={12}
          clusterRadius={48}
        >
          <Layer
            id="korea-fest-clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': '#f59e0b',
              'circle-opacity': 0.85,
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                16,
                8,
                20,
                20,
                26,
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#1b1410',
            }}
          />
          <Layer
            id="korea-fest-cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': ['get', 'point_count_abbreviated'],
              'text-size': 12,
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
            }}
            paint={{ 'text-color': '#1b1410' }}
          />
          <Layer
            id="korea-fest-unclustered"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-color': '#fbbf24',
              'circle-radius': 7,
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#1b1410',
            }}
          />
        </Source>
      </Map>
      <div className="pointer-events-none absolute bottom-2 left-2 right-14 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-white/80">
        {CAPTION_LINKS.map((item, idx) => (
          <React.Fragment key={item.label}>
            {idx > 0 ? <span className="text-white/40">·</span> : null}
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto underline-offset-2 hover:underline hover:text-amber-200"
            >
              {item.label}
            </a>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
