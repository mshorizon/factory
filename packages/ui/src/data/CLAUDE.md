# Service Area Dots Generator - Instructions for Claude

This directory contains **pre-calculated** service area map dots for business location visualization. These dots are generated **once** and loaded at runtime for performance.

## 🎯 Critical Concept: Pre-calculation vs Runtime

**NEVER** calculate dots at page load. Always pre-calculate and save to `service-area-dots.ts`.

- ❌ **Wrong**: Point-in-polygon calculations in component render
- ✅ **Correct**: Load pre-calculated dots from data file

## 📐 Projection Requirements

### MANDATORY: Use d3-geo Mercator Projection

**You MUST use `geoMercator().fitSize()` from d3-geo.** DO NOT use simple linear projection.

```javascript
import { geoMercator } from 'd3-geo';

// ✅ CORRECT - d3-geo Mercator
const projection = geoMercator().fitSize([width, height], countryGeoJSON);
const screenCoords = geoCoords.map(c => projection(c));

// ❌ WRONG - Simple linear projection (causes horizontal flattening)
const x = ((lon - lonMin) / (lonMax - lonMin)) * width;  // DON'T DO THIS
const y = height - ((lat - latMin) / (latMax - latMin)) * height;
```

**Why Mercator?** Geographic coordinates are spherical. Linear projection distorts shapes, especially horizontally. Mercator preserves angles and shapes correctly for mapping.

## 🗺️ GeoJSON Data Sources

### For Countries (Outer Boundary)

**Source**: Natural Earth or OpenStreetMap

```javascript
// Option 1: Natural Earth (recommended for countries)
const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';
const data = await fetch(url).then(r => r.json());
const country = data.features.find(f => f.properties.NAME === 'Poland');

// Option 2: OpenStreetMap Nominatim (for any region)
const url = 'https://nominatim.openstreetmap.org/search.php?q=Poland&polygon_geojson=1&format=jsonv2';
```

### For Regions (Highlighted Area)

**Source**: OpenStreetMap administrative boundaries

```javascript
const url = 'https://nominatim.openstreetmap.org/search.php?q=Mazowieckie,Poland&polygon_geojson=1&format=jsonv2';
```

### Coordinate Limits

**Very Important**: OSM often returns **extremely detailed** polygons (20k-70k points).

**You MUST subsample** to reasonable density:
- **Country**: ~1000-2000 points
- **Region**: ~300-500 points

```javascript
function subsample(coords, targetCount) {
  const step = Math.floor(coords.length / targetCount);
  const result = [];
  for (let i = 0; i < coords.length; i += step) {
    result.push(coords[i]);
  }
  // Always include last point to close polygon
  result.push(coords[coords.length - 1]);
  return result;
}
```

## 🔧 Generation Script Template

**Location**: Create in `/home/dev/factory/apps/engine/precalc-dots.mjs` (has access to d3-geo)

```javascript
import { readFileSync, writeFileSync } from 'fs';
import { geoMercator } from 'd3-geo';

// 1. Load or fetch GeoJSON coordinates
const countryCoords = [...]; // From Natural Earth or OSM
const regionCoords = [...];  // From OSM

// 2. Create GeoJSON Features
const countryGeoJSON = {
  type: 'Feature',
  properties: { name: 'CountryName' },
  geometry: { type: 'Polygon', coordinates: [countryCoords] }
};

// 3. Map configuration
const width = 500;
const height = 600;
const spacing = 8;  // Distance between dots (pixels)

// 4. Set up Mercator projection
const projection = geoMercator().fitSize([width, height], countryGeoJSON);

// 5. Project to screen space
const countryScreen = countryCoords.map(c => projection(c));
const regionScreen = regionCoords.map(c => projection(c));

// 6. Point-in-polygon helper
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

// 7. Generate dots
const dots = [];
for (let x = spacing / 2; x < width; x += spacing) {
  for (let y = spacing / 2; y < height; y += spacing) {
    if (isPointInPolygon(x, y, countryScreen)) {
      const inRegion = isPointInPolygon(x, y, regionScreen);
      dots.push({ x, y, inRegion });
    }
  }
}

console.log(`Generated ${dots.length} dots`);
console.log(`- Country only: ${dots.filter(d => !d.inRegion).length}`);
console.log(`- Region: ${dots.filter(d => d.inRegion).length}`);

// 8. Save to service-area-dots.ts
// (See file structure below)
```

## ✅ Quality Checks - MANDATORY

**BEFORE saving the generated dots, you MUST verify:**

### 1. Visual Shape Check
```javascript
// Check that projected coordinates form expected shape
const bounds = {
  minX: Math.min(...countryScreen.map(p => p[0])),
  maxX: Math.max(...countryScreen.map(p => p[0])),
  minY: Math.min(...countryScreen.map(p => p[1])),
  maxY: Math.max(...countryScreen.map(p => p[1]))
};

console.log('Bounds:', bounds);
// Should be roughly: minX ≈ 0, maxX ≈ width, minY ≈ 0, maxY ≈ height
// If bounds are way off (e.g., minX: 200, maxX: 300), projection is WRONG
```

### 2. Dot Count Sanity Check
```javascript
const expectedDots = (width / spacing) * (height / spacing) * 0.5; // ~50% coverage
console.log(`Expected: ~${Math.floor(expectedDots)}, Got: ${dots.length}`);

// Poland (500x600, spacing 8): expect ~1500-3000 dots
// If you get <500 or >5000, something is WRONG
```

### 3. Region Coverage Check
```javascript
const regionRatio = dots.filter(d => d.inRegion).length / dots.length;
console.log(`Region covers ${(regionRatio * 100).toFixed(1)}% of country`);

// Mazowieckie should be ~10-15% of Poland
// If 0% or >50%, check your region GeoJSON
```

### 4. Coordinate Validation
```javascript
// Ensure all dots are within bounds
const invalidDots = dots.filter(d =>
  d.x < 0 || d.x > width || d.y < 0 || d.y > height
);
if (invalidDots.length > 0) {
  console.error('INVALID DOTS FOUND:', invalidDots.length);
  throw new Error('Dots outside canvas bounds - PROJECTION ERROR');
}
```

## 📁 Output File Structure

**File**: `packages/ui/src/data/service-area-dots.ts`

```typescript
export interface ServiceAreaDot {
  x: number;
  y: number;
  inRegion: boolean;
}

export const SERVICE_AREA_DOTS = {
  'polska-mazowsze': {
    width: 500,
    height: 600,
    dots: [/* ... */]
  },
  'polska-slaskie': {
    width: 500,
    height: 600,
    dots: [/* ... */]
  },
  // Add new regions here
} as const;

export type ServiceAreaKey = keyof typeof SERVICE_AREA_DOTS;
```

**Naming Convention**: `'country-region'` (lowercase, no special chars)

## 🔄 Adding New Service Areas

### Step 1: Generate Dots

```bash
cd /home/dev/factory/apps/engine
# Create precalc-dots.mjs (see template above)
npx tsx precalc-dots.mjs
```

### Step 2: Update Schema

Edit `packages/schema/src/business.schema.json`:

```json
"area": {
  "properties": {
    "country": {
      "enum": ["polska", "niemcy", "czechy"]  // Add new country
    },
    "region": {
      "enum": ["mazowsze", "slaskie", "bayern"]  // Add new region
    }
  }
}
```

```bash
cd packages/schema
pnpm generate  # Regenerate TypeScript types
```

### Step 3: Update Business JSON

In template or business JSON:

```json
{
  "type": "serviceArea",
  "area": {
    "country": "polska",
    "region": "slaskie"
  }
}
```

### Step 4: Rebuild & Deploy

```bash
cd /home/dev/factory
pnpm build --filter @mshorizon/ui
pm2 restart astro-dev

# Sync to database
cd packages/db
DATABASE_URL="..." pnpm run db:seed
```

## 🐛 Common Mistakes

### ❌ Using Linear Projection
**Symptom**: Map looks horizontally flattened/squished
**Fix**: Use `geoMercator().fitSize()`, NOT linear math

### ❌ Too Many Coordinates
**Symptom**: File >10MB, slow builds
**Fix**: Subsample to 1k-2k points for country, 300-500 for region

### ❌ Wrong Polygon Order
**Symptom**: Region doesn't highlight correctly
**Fix**: Ensure coordinates are [longitude, latitude] (NOT lat/lon)

### ❌ Skipping Quality Checks
**Symptom**: Weird shapes, missing dots, wrong coverage
**Fix**: Run ALL 4 quality checks above before saving

## 📊 Performance Expectations

- **Generation time**: 1-5 seconds
- **File size**: 100-500KB per region
- **Runtime**: Instant (just loading JSON)
- **Build time**: +2-5s for TypeScript compilation

## 🎓 Key Principles

1. **Always use d3-geo Mercator projection** - preserves geographic accuracy
2. **Pre-calculate, never calculate at runtime** - performance critical
3. **Validate before saving** - wrong data is worse than no data
4. **Subsample OSM data** - raw data is too detailed
5. **Document your sources** - include URL/date in comments

---

**Last Updated**: 2026-03-10
**Current Regions**: polska-mazowsze
**Generator Location**: `/home/dev/factory/apps/engine/precalc-dots.mjs`
