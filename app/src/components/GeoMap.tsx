'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import type { Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl';
import type { Candidate } from '@/lib/types';
import StatusBadge from './StatusBadge';

interface GeoMapProps {
  allCandidates: Candidate[];
  rankedCandidates: Candidate[];
  currentK: number;
  selectedTile: string;
  onCandidateClick?: (candidate: Candidate) => void;
}

export default function GeoMap({
  allCandidates,
  rankedCandidates,
  currentK,
  selectedTile,
  onCandidateClick,
}: GeoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);

  const topKSet = new Set(
    rankedCandidates.slice(0, currentK).map(c => c.candidate)
  );
  const usableSet = new Set(rankedCandidates.map(c => c.candidate));

  const initMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const maplibregl = await import('maplibre-gl');
    await import('maplibre-gl/dist/maplibre-gl.css');

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [allCandidates[0]?.lon ?? 0, allCandidates[0]?.lat ?? 0],
      zoom: 12,
      attributionControl: {},
    });

    mapInstanceRef.current = map;

    map.on('load', () => {
      updateMapData(map);
    });
  // We only want to init the map once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMapData = useCallback((map: MapLibreMap) => {
    // Remove existing layers/sources
    ['topk-fill', 'topk-outline', 'usable-fill', 'usable-outline', 'rejected-fill', 'rejected-outline', 'hr-outline'].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    ['candidates', 'hr-source'].forEach(id => {
      if (map.getSource(id)) map.removeSource(id);
    });

    // Build GeoJSON features for all candidates
    const features = allCandidates.map(c => {
      const isTopK = topKSet.has(c.candidate);
      const isUsable = usableSet.has(c.candidate);
      return {
        type: 'Feature' as const,
        properties: {
          candidate: c.candidate,
          category: isTopK ? 'topk' : isUsable ? 'usable' : 'rejected',
          tile: c.tile,
          date: c.lowres_date,
          rank: c.rank ?? null,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [c.left, c.bottom],
            [c.right, c.bottom],
            [c.right, c.top],
            [c.left, c.top],
            [c.left, c.bottom],
          ]],
        },
      };
    });

    map.addSource('candidates', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });

    // Rejected footprints (muted)
    map.addLayer({
      id: 'rejected-fill',
      type: 'fill',
      source: 'candidates',
      filter: ['==', ['get', 'category'], 'rejected'],
      paint: {
        'fill-color': '#B5544A',
        'fill-opacity': 0.05,
      },
    });
    map.addLayer({
      id: 'rejected-outline',
      type: 'line',
      source: 'candidates',
      filter: ['==', ['get', 'category'], 'rejected'],
      paint: {
        'line-color': '#B5544A',
        'line-width': 0.5,
        'line-opacity': 0.3,
      },
    });

    // Usable footprints
    map.addLayer({
      id: 'usable-fill',
      type: 'fill',
      source: 'candidates',
      filter: ['==', ['get', 'category'], 'usable'],
      paint: {
        'fill-color': '#7A9B6E',
        'fill-opacity': 0.05,
      },
    });
    map.addLayer({
      id: 'usable-outline',
      type: 'line',
      source: 'candidates',
      filter: ['==', ['get', 'category'], 'usable'],
      paint: {
        'line-color': '#7A9B6E',
        'line-width': 1,
        'line-opacity': 0.5,
      },
    });

    // Top-K footprints (highlighted)
    map.addLayer({
      id: 'topk-fill',
      type: 'fill',
      source: 'candidates',
      filter: ['==', ['get', 'category'], 'topk'],
      paint: {
        'fill-color': '#7A9B6E',
        'fill-opacity': 0.15,
      },
    });
    map.addLayer({
      id: 'topk-outline',
      type: 'line',
      source: 'candidates',
      filter: ['==', ['get', 'category'], 'topk'],
      paint: {
        'line-color': '#7A9B6E',
        'line-width': 2,
        'line-opacity': 0.9,
      },
    });

    // HR reference outline
    if (allCandidates.length > 0) {
      const hr = allCandidates[0];
      map.addSource('hr-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [hr.left, hr.bottom],
              [hr.right, hr.bottom],
              [hr.right, hr.top],
              [hr.left, hr.top],
              [hr.left, hr.bottom],
            ]],
          },
        },
      });
      map.addLayer({
        id: 'hr-outline',
        type: 'line',
        source: 'hr-source',
        paint: {
          'line-color': '#D97840',
          'line-width': 2,
          'line-dasharray': [3, 2],
        },
      });
    }

    // Click handler
    map.on('click', 'topk-fill', (e: MapLayerMouseEvent) => {
      const props = e.features?.[0]?.properties;
      if (props) {
        const c = allCandidates.find(cand => cand.candidate === props.candidate);
        if (c) onCandidateClick?.(c);
      }
    });
    map.on('click', 'usable-fill', (e: MapLayerMouseEvent) => {
      const props = e.features?.[0]?.properties;
      if (props) {
        const c = allCandidates.find(cand => cand.candidate === props.candidate);
        if (c) onCandidateClick?.(c);
      }
    });

    // Cursor
    map.on('mouseenter', 'topk-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'topk-fill', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', 'usable-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'usable-fill', () => { map.getCanvas().style.cursor = ''; });

    // Fly to bounds
    if (allCandidates.length > 0) {
      const c = allCandidates[0];
      map.fitBounds([[c.left, c.bottom], [c.right, c.top]], { padding: 60, duration: 500 });
    }
  }, [allCandidates, topKSet, usableSet, onCandidateClick]);

  useEffect(() => {
    initMap();
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [initMap]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && map.isStyleLoaded()) {
      updateMapData(map);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTile, currentK]);

  return (
    <div id="geomap" className="panel overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="section-label">GEOSPATIAL VIEW</div>
        <StatusBadge type="data" label="REAL FOOTPRINTS" />
      </div>
      <div ref={mapRef} className="h-80 w-full" />
    </div>
  );
}
