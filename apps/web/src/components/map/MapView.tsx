import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ProjectCategory, ProjectStatus } from '@transparency-ph/shared-types';
import { boundsToBboxString, projectsToFeatureCollection } from '../../lib/geo';
import { filterByActiveSet } from '../../lib/filterProjects';
import { STATUS_COLORS } from '../../lib/statusColors';
import { useProjects } from '../../hooks/useProjects';
import { ProjectPopup } from './ProjectPopup';

// Cagayan de Oro. Initial project scope — the API and this component are
// already viewport-driven, so widening coverage later is a data problem
// (more projects in the DB), not a code change here.
const CDO_CENTER: [number, number] = [124.6319, 8.4822];
const CDO_ZOOM = 12.5;

const SOURCE_ID = 'projects';
const CLUSTER_LAYER = 'clusters';
const CLUSTER_COUNT_LAYER = 'cluster-count';
const POINT_LAYER = 'unclustered-point';

// A MapTiler key gives the fully art-directed ledger-toned basemap; without
// one (e.g. a fresh clone before the dev has signed up), fall back to
// OpenFreeMap's hosted "Liberty" style, which needs no key at all, so the
// map is never just blank.
function resolveStyleUrl(): string {
  const key = import.meta.env.VITE_MAPTILER_KEY;
  return key
    ? `https://api.maptiler.com/maps/dataviz-light/style.json?key=${key}`
    : 'https://tiles.openfreemap.org/styles/liberty';
}

/** Builds the MapLibre `match` expression coloring each pin by status. */
function statusMatchExpression(): maplibregl.ExpressionSpecification {
  const pairs = (Object.entries(STATUS_COLORS) as [ProjectStatus, string][]).flat();
  return ['match', ['get', 'status'], ...pairs, '#8891A3'] as unknown as maplibregl.ExpressionSpecification;
}

interface MapViewProps {
  activeStatuses: ReadonlySet<ProjectStatus>;
  activeCategories: ReadonlySet<ProjectCategory>;
}

export function MapView({ activeStatuses, activeCategories }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const navigate = useNavigate();

  const [bbox, setBbox] = useState<string | null>(null);
  const { data, isError, error } = useProjects({ bbox });

  // Mount the map once. MapLibre is imperative and owns its own DOM subtree
  // inside containerRef — it does not get re-created on React re-renders;
  // subsequent effects push new data into the existing instance instead.
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: resolveStyleUrl(),
      center: CDO_CENTER,
      zoom: CDO_ZOOM,
      minZoom: 6,
      maxZoom: 18,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addLayer({
        id: CLUSTER_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#101A2E',
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 26],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#F1F3EF',
        },
      });

      map.addLayer({
        id: CLUSTER_COUNT_LAYER,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Noto Sans Medium'],
          'text-size': 12,
        },
        paint: { 'text-color': '#F1F3EF' },
      });

      map.addLayer({
        id: POINT_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': statusMatchExpression(),
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#F1F3EF',
        },
      });

      // Initial viewport, so the first fetch fires without waiting for the
      // user to pan.
      setBbox(boundsToBboxString(map.getBounds()));
    });

    map.on('moveend', () => {
      setBbox(boundsToBboxString(map.getBounds()));
    });

    map.on('mouseenter', CLUSTER_LAYER, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', CLUSTER_LAYER, () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('mouseenter', POINT_LAYER, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', POINT_LAYER, () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('click', CLUSTER_LAYER, (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER] });
      const clusterId = features[0]?.properties?.cluster_id;
      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
      if (clusterId === undefined) return;
      source.getClusterExpansionZoom(clusterId).then((zoom) => {
        const geometry = features[0].geometry;
        if (geometry.type !== 'Point') return;
        map.easeTo({ center: geometry.coordinates as [number, number], zoom });
      });
    });

    map.on('click', POINT_LAYER, (e) => {
      const feature = e.features?.[0];
      if (!feature || feature.geometry.type !== 'Point') return;
      const coordinates = feature.geometry.coordinates.slice() as [number, number];
      const project = feature.properties as unknown as import('../../lib/types').ProjectListItem;

      popupRootRef.current?.unmount();
      popupRef.current?.remove();

      const node = document.createElement('div');
      const root = createRoot(node);
      popupRootRef.current = root;
      root.render(
        <ProjectPopup project={project} onViewDetails={() => navigate(`/projects/${project.slug}`)} />,
      );

      const popup = new maplibregl.Popup({ closeButton: true, maxWidth: '280px' })
        .setLngLat(coordinates)
        .setDOMContent(node)
        .addTo(map);
      popup.on('close', () => {
        popupRootRef.current?.unmount();
        popupRootRef.current = null;
      });
      popupRef.current = popup;
    });

    return () => {
      popupRootRef.current?.unmount();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once by design
  }, []);

  // Push new query results into the already-mounted map's source, rather
  // than re-creating the map, whenever the bbox-filtered data OR the active
  // status/category selections change. Status/category filtering happens
  // here (client-side) rather than as API query params — the API's
  // status/category filters only accept one value each, which can't
  // express a multi-select "show ONGOING and DELAYED" filter; filtering
  // the already-fetched viewport data is also instant, no refetch needed
  // when someone just toggles a legend row.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource(SOURCE_ID) || !data) return;
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
    const visible = filterByActiveSet(data.data, activeStatuses, activeCategories);
    source.setData(projectsToFeatureCollection(visible));
  }, [data, activeStatuses, activeCategories]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {isError && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-sm border border-status-cancelled/40 bg-white px-4 py-2 text-sm text-status-cancelled shadow-sm">
          Couldn't load projects: {error instanceof Error ? error.message : 'unknown error'}
        </div>
      )}
    </div>
  );
}
