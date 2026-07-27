import type { LngLatBounds } from 'maplibre-gl';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { ProjectListItem } from './types';

/**
 * Formats a MapLibre viewport into the "minLng,minLat,maxLng,maxLat" string
 * the API's bbox filter expects (see projectQuerySchema in shared-types).
 * Kept as a pure function, separate from MapView, so it's trivial to unit
 * test without a real map instance.
 */
export function boundsToBboxString(bounds: LngLatBounds): string {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const round = (n: number) => Math.round(n * 1e5) / 1e5; // ~1m precision
  return [round(sw.lng), round(sw.lat), round(ne.lng), round(ne.lat)].join(',');
}

export type ProjectFeature = Feature<Point, ProjectListItem>;

/**
 * Builds the GeoJSON FeatureCollection MapLibre's clustering source needs.
 * Each feature's `properties` carries the full ProjectListItem so the
 * unclustered-point click handler (ProjectPopup) has everything it needs
 * without a second lookup.
 */
export function projectsToFeatureCollection(
  projects: ProjectListItem[],
): FeatureCollection<Point, ProjectListItem> {
  return {
    type: 'FeatureCollection',
    features: projects.map(
      (project): ProjectFeature => ({
        type: 'Feature',
        id: project.id,
        geometry: {
          type: 'Point',
          coordinates: [project.longitude, project.latitude],
        },
        properties: project,
      }),
    ),
  };
}
