import { POLAND_BORDER, VOIVODESHIPS, type Region } from "./poland-geo";

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 */
function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Get bounding box for a polygon
 */
function getBoundingBox(polygon: number[][]): {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
} {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of polygon) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLon, maxLon, minLat, maxLat };
}

export interface DottedMapOptions {
  /** Country border (default: Poland) */
  countryBorder?: number[][];
  /** Region to highlight (e.g., "mazowieckie") */
  highlightRegion?: string;
  /** Width of the SVG */
  width?: number;
  /** Height of the SVG */
  height?: number;
  /** Dot spacing (lower = more dots) */
  dotSpacing?: number;
  /** Dot size */
  dotSize?: number;
}

export interface DottedMapResult {
  svg: string;
  viewBox: string;
}

/**
 * Generate a dotted map SVG showing a country with optional region highlight
 */
export function generateDottedMap(options: DottedMapOptions = {}): DottedMapResult {
  const {
    countryBorder = POLAND_BORDER,
    highlightRegion,
    width = 400,
    height = 300,
    dotSpacing = 0.15, // degrees
    dotSize = 1.5
  } = options;

  const bbox = getBoundingBox(countryBorder);
  const aspectRatio = (bbox.maxLon - bbox.minLon) / (bbox.maxLat - bbox.minLat);

  // Adjust viewBox to maintain aspect ratio
  const viewBoxWidth = bbox.maxLon - bbox.minLon;
  const viewBoxHeight = viewBoxWidth / aspectRatio;
  const viewBox = `${bbox.minLon} ${bbox.minLat} ${viewBoxWidth} ${viewBoxHeight}`;

  const dots: Array<{ x: number; y: number; highlight: boolean }> = [];

  // Get highlight region coordinates if specified
  const highlightCoords = highlightRegion && VOIVODESHIPS[highlightRegion]
    ? VOIVODESHIPS[highlightRegion].coordinates
    : null;

  // Generate grid of points
  for (let lon = bbox.minLon; lon <= bbox.maxLon; lon += dotSpacing) {
    for (let lat = bbox.minLat; lat <= bbox.maxLat; lat += dotSpacing) {
      const point: [number, number] = [lon, lat];

      // Check if point is inside country border
      if (isPointInPolygon(point, countryBorder)) {
        // Check if point is in highlighted region
        const highlight = highlightCoords
          ? isPointInPolygon(point, highlightCoords)
          : false;

        dots.push({ x: lon, y: lat, highlight });
      }
    }
  }

  // Generate SVG
  const dotElements = dots.map(dot => {
    const className = dot.highlight ? 'dot-highlight' : 'dot-base';
    return `<circle cx="${dot.x}" cy="${dot.y}" r="${dotSize * 0.01}" class="${className}" />`;
  }).join('\n    ');

  const svg = `<svg viewBox="${viewBox}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
  <style>
    .dot-base { fill: currentColor; opacity: 0.4; }
    .dot-highlight { fill: var(--primary, #FFC633); opacity: 0.8; }
  </style>
  <g transform="scale(1, -1) translate(0, ${-(bbox.minLat + viewBoxHeight)})">
    ${dotElements}
  </g>
</svg>`;

  return { svg, viewBox };
}
