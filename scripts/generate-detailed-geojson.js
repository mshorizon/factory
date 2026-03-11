// Generate detailed GeoJSON for Poland and Mazowieckie

const polandBase = [
  [14.1, 54.8], [14.575, 54.725], [15.05, 54.65], [15.525, 54.575], [16.0, 54.5],
  [16.625, 54.533], [17.25, 54.567], [17.875, 54.6], [18.5, 54.633], [19.775, 54.567],
  [21.05, 54.5], [22.325, 54.433], [23.6, 54.367], [23.825, 54.092], [24.05, 53.817],
  [24.075, 53.408], [24.1, 53.0], [24.075, 52.625], [24.05, 52.25], [24.025, 51.875],
  [24.0, 51.5], [23.95, 51.125], [23.9, 50.75], [23.85, 50.375], [23.8, 50.0],
  [23.45, 49.75], [23.1, 49.5], [22.75, 49.25], [22.4, 49.125], [22.05, 49.2],
  [21.7, 49.275], [21.35, 49.287], [21.0, 49.3], [20.5, 49.275], [20.0, 49.25],
  [19.5, 49.225], [19.0, 49.2], [18.625, 49.275], [18.25, 49.35], [17.875, 49.425],
  [17.5, 49.5], [17.125, 49.625], [16.75, 49.75], [16.375, 49.875], [16.0, 50.0],
  [15.7, 50.125], [15.4, 50.25], [15.1, 50.375], [14.8, 50.5], [14.725, 50.625],
  [14.65, 50.75], [14.575, 50.875], [14.5, 51.0], [14.425, 51.375], [14.35, 51.75],
  [14.275, 52.125], [14.2, 52.5], [14.275, 52.833], [14.35, 53.167], [14.425, 53.5],
  [14.4, 53.9], [14.325, 54.3], [14.25, 54.55], [14.175, 54.675]
];

const mazowieckieBase = [
  [19.8, 53.5], [20.125, 53.45], [20.45, 53.4], [20.775, 53.35], [21.1, 53.3],
  [21.55, 53.267], [22.0, 53.233], [22.25, 53.133], [22.5, 53.033], [22.5, 52.8],
  [22.5, 52.567], [22.5, 52.333], [22.5, 52.1], [22.425, 51.9], [22.35, 51.7],
  [22.25, 51.5], [22.15, 51.375], [21.967, 51.35], [21.783, 51.325], [21.6, 51.3],
  [21.225, 51.3], [20.85, 51.3], [20.475, 51.3], [20.1, 51.35], [19.85, 51.375],
  [19.6, 51.4], [19.525, 51.467], [19.45, 51.533], [19.4, 51.65], [19.35, 51.767],
  [19.325, 51.9], [19.3, 52.033], [19.275, 52.167], [19.25, 52.3], [19.283, 52.45],
  [19.317, 52.6], [19.4, 52.775], [19.483, 52.95], [19.567, 53.1], [19.65, 53.25],
  [19.733, 53.35]
];

function interpolate(coords, factor = 4) {
  const result = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    result.push([x1, y1]);
    for (let j = 1; j < factor; j++) {
      const t = j / factor;
      result.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
  }
  result.push(coords[0]);
  return result;
}

function formatCoords(coords) {
  let output = '        [\n';
  for (let i = 0; i < coords.length; i++) {
    const [x, y] = coords[i];
    output += `          [${x.toFixed(6)}, ${y.toFixed(6)}]`;
    if (i < coords.length - 1) output += ',';
    output += '\n';
  }
  output += '        ]';
  return output;
}

const polandDetailed = interpolate(polandBase, 4);
const mazowieckieDetailed = interpolate(mazowieckieBase, 4);

const polandGeoJSON = `export const polandDetailedGeoJSON: GeoJSON.Feature = {
  type: 'Feature',
  properties: { name: 'Poland' },
  geometry: {
    type: 'Polygon',
    coordinates: [
${formatCoords(polandDetailed)}
    ],
  },
};`;

const mazowieckieGeoJSON = `export const mazowieckieDetailedGeoJSON: GeoJSON.Feature = {
  type: 'Feature',
  properties: { name: 'Mazowieckie', capital: 'Warsaw' },
  geometry: {
    type: 'Polygon',
    coordinates: [
${formatCoords(mazowieckieDetailed)}
    ],
  },
};`;

console.log(polandGeoJSON);
console.log('\n');
console.log(mazowieckieGeoJSON);
