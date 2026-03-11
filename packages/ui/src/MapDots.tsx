import React from 'react';
import { geoPath, geoMercator } from 'd3-geo';
import type { GeoPermissibleObjects } from 'd3-geo';

interface MapDotsProps {
  /** GeoJSON for the base map (e.g., Poland) */
  baseMapGeoJSON: GeoPermissibleObjects;
  /** GeoJSON for the highlighted region (e.g., Masovian) */
  highlightedRegionGeoJSON?: GeoPermissibleObjects;
  /** Spacing between dots in pixels */
  spacing?: number;
  /** Dot radius in pixels */
  dotRadius?: number;
  /** Color for base map dots */
  baseColor?: string;
  /** Color for highlighted region dots */
  highlightColor?: string;
  /** SVG width */
  width?: number;
  /** SVG height */
  height?: number;
  /** Optional CSS class */
  className?: string;
}

export const MapDots: React.FC<MapDotsProps> = ({
  baseMapGeoJSON,
  highlightedRegionGeoJSON,
  spacing = 8,
  dotRadius = 2,
  baseColor = 'currentColor',
  highlightColor = 'var(--primary)',
  width = 500,
  height = 600,
  className = '',
}) => {
  // Set up projection
  const projection = geoMercator().fitSize([width, height], baseMapGeoJSON);
  const path = geoPath().projection(projection);

  // Generate dot grid
  const dots: Array<{ x: number; y: number; highlighted: boolean }> = [];

  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {
      const coords = projection.invert?.([x, y]);
      if (!coords) continue;

      // Check if point is inside base map
      const isInBaseMap = isPointInGeoJSON(coords, baseMapGeoJSON);
      if (!isInBaseMap) continue;

      // Check if point is in highlighted region
      const isHighlighted = highlightedRegionGeoJSON
        ? isPointInGeoJSON(coords, highlightedRegionGeoJSON)
        : false;

      dots.push({ x, y, highlighted: isHighlighted });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      style={{ color: baseColor }}
    >
      {dots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={dotRadius}
          fill={dot.highlighted ? highlightColor : baseColor}
          opacity={dot.highlighted ? 0.8 : 0.4}
        />
      ))}
    </svg>
  );
};

/**
 * Check if a point [longitude, latitude] is inside a GeoJSON geometry
 */
function isPointInGeoJSON(
  point: [number, number],
  geoJSON: GeoPermissibleObjects
): boolean {
  const [lon, lat] = point;

  if ('type' in geoJSON && geoJSON.type === 'FeatureCollection' && 'features' in geoJSON) {
    return geoJSON.features.some((feature: any) =>
      isPointInGeometry(lon, lat, feature.geometry)
    );
  }

  if ('type' in geoJSON && geoJSON.type === 'Feature' && 'geometry' in geoJSON) {
    return isPointInGeometry(lon, lat, geoJSON.geometry as any);
  }

  return isPointInGeometry(lon, lat, geoJSON as any);
}

function isPointInGeometry(
  lon: number,
  lat: number,
  geometry: GeoJSON.Geometry
): boolean {
  if (geometry.type === 'Polygon') {
    return isPointInPolygon(lon, lat, geometry.coordinates);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) =>
      isPointInPolygon(lon, lat, polygon)
    );
  }

  return false;
}

function isPointInPolygon(
  lon: number,
  lat: number,
  polygon: GeoJSON.Position[][]
): boolean {
  // Check if point is in the outer ring
  const outerRing = polygon[0];
  if (!isPointInRing(lon, lat, outerRing)) {
    return false;
  }

  // Check if point is NOT in any holes
  for (let i = 1; i < polygon.length; i++) {
    if (isPointInRing(lon, lat, polygon[i])) {
      return false;
    }
  }

  return true;
}

function isPointInRing(
  lon: number,
  lat: number,
  ring: GeoJSON.Position[]
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0],
      yi = ring[i][1];
    const xj = ring[j][0],
      yj = ring[j][1];

    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
