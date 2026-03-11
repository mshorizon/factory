// Pre-calculate service area dots using proper d3-geo Mercator projection
import { readFileSync, writeFileSync } from 'fs';
import { geoMercator } from 'd3-geo';

// Read GeoJSON data
const polandCoords = JSON.parse(readFileSync('/tmp/poland-base-coords.json', 'utf-8'));
const mazowieckieCoords = JSON.parse(readFileSync('/tmp/mazowieckie-medium.json', 'utf-8'));

// Create proper GeoJSON Features
const polandGeoJSON = {
  type: 'Feature',
  properties: { name: 'Poland' },
  geometry: {
    type: 'Polygon',
    coordinates: [polandCoords]
  }
};

// Map configuration
const width = 500;
const height = 600;
const spacing = 8;

// Set up d3-geo Mercator projection
const projection = geoMercator().fitSize([width, height], polandGeoJSON);

// Project coordinates to screen space
const polandScreen = polandCoords.map(c => projection(c));
const mazowieckieScreen = mazowieckieCoords.map(c => projection(c));

// Point-in-polygon check
function isPointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Generate dots
console.log('Generating dots with Mercator projection...');
const dots = [];
for (let x = spacing / 2; x < width; x += spacing) {
  for (let y = spacing / 2; y < height; y += spacing) {
    if (isPointInPolygon(x, y, polandScreen)) {
      const inMazowsze = isPointInPolygon(x, y, mazowieckieScreen);
      dots.push({ x, y, inMazowsze });
    }
  }
}

console.log(`Generated ${dots.length} dots`);
console.log(`- Poland only: ${dots.filter(d => !d.inMazowsze).length}`);
console.log(`- Mazowieckie: ${dots.filter(d => d.inMazowsze).length}`);

// Create TypeScript data file
const output = `/**
 * Pre-calculated service area dots
 * Generated using d3-geo Mercator projection (same as original runtime code)
 * Region: Poland with Mazowieckie highlighted
 */

export interface ServiceAreaDot {
  x: number;
  y: number;
  inRegion: boolean;
}

export const SERVICE_AREA_DOTS = {
  'polska-mazowsze': {
    width: ${width},
    height: ${height},
    dots: ${JSON.stringify(dots.map(d => ({ x: d.x, y: d.y, inRegion: d.inMazowsze })), null, 2)}
  }
} as const;

export type ServiceAreaKey = keyof typeof SERVICE_AREA_DOTS;
`;

writeFileSync('../../packages/ui/src/data/service-area-dots.ts', output);
console.log('Saved with proper Mercator projection');
