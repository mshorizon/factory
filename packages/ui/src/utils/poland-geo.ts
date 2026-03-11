// Simplified Poland and voivodeship boundaries (GeoJSON coordinates)
// Coordinates: [longitude, latitude]

export interface Region {
  name: string;
  coordinates: number[][];
}

// Simplified Poland border (clockwise from northwest)
export const POLAND_BORDER: number[][] = [
  [14.1, 53.9], [14.7, 54.4], [15.0, 54.5], [16.0, 54.5], [17.5, 54.8],
  [18.6, 54.7], [19.4, 54.4], [20.5, 54.4], [22.7, 54.3], [23.9, 54.4],
  [24.1, 53.9], [24.1, 53.0], [23.9, 52.5], [24.0, 51.6], [24.0, 50.8],
  [23.5, 50.4], [22.8, 49.6], [22.5, 49.1], [21.0, 49.4], [20.0, 49.2],
  [18.9, 49.4], [18.0, 49.9], [17.0, 49.6], [16.0, 50.0], [15.0, 50.8],
  [14.8, 51.0], [14.6, 51.8], [14.7, 52.5], [14.4, 53.3], [14.1, 53.9]
];

// Polish voivodeships (wojewódzwa) - simplified boundaries
export const VOIVODESHIPS: Record<string, Region> = {
  "mazowieckie": {
    name: "Mazowieckie",
    coordinates: [
      [19.5, 53.5], [21.8, 53.3], [22.9, 52.8], [23.2, 52.0], [22.5, 51.2],
      [21.5, 51.3], [20.5, 51.6], [19.8, 52.0], [19.5, 52.8], [19.5, 53.5]
    ]
  },
  "wielkopolskie": {
    name: "Wielkopolskie",
    coordinates: [
      [15.5, 53.3], [17.8, 53.2], [18.2, 52.8], [18.5, 52.0], [17.8, 51.2],
      [16.5, 51.0], [15.8, 51.5], [15.5, 52.2], [15.5, 53.3]
    ]
  },
  "dolnoslaskie": {
    name: "Dolnośląskie",
    coordinates: [
      [14.7, 51.8], [16.5, 51.8], [17.2, 51.2], [17.0, 50.5], [16.2, 50.0],
      [15.0, 50.2], [14.7, 50.8], [14.7, 51.8]
    ]
  },
  "kujawsko-pomorskie": {
    name: "Kujawsko-Pomorskie",
    coordinates: [
      [17.5, 53.8], [19.7, 53.8], [19.8, 53.0], [19.0, 52.5], [17.8, 52.5],
      [17.0, 53.0], [17.5, 53.8]
    ]
  },
  "lubelskie": {
    name: "Lubelskie",
    coordinates: [
      [21.8, 52.5], [24.1, 52.2], [24.1, 50.5], [23.0, 50.2], [22.0, 50.5],
      [21.5, 51.3], [21.8, 52.5]
    ]
  },
  "lubuskie": {
    name: "Lubuskie",
    coordinates: [
      [14.1, 53.5], [15.8, 53.5], [15.8, 52.0], [15.0, 51.5], [14.5, 51.8],
      [14.1, 52.5], [14.1, 53.5]
    ]
  },
  "lodzkie": {
    name: "Łódzkie",
    coordinates: [
      [18.2, 52.5], [20.5, 52.5], [20.5, 51.2], [19.0, 51.0], [18.0, 51.2],
      [18.2, 52.5]
    ]
  },
  "malopolskie": {
    name: "Małopolskie",
    coordinates: [
      [18.8, 50.8], [21.5, 50.5], [21.0, 49.5], [19.5, 49.2], [18.5, 49.5],
      [18.8, 50.8]
    ]
  },
  "opolskie": {
    name: "Opolskie",
    coordinates: [
      [17.0, 51.2], [18.5, 51.0], [18.2, 50.2], [17.2, 50.2], [17.0, 51.2]
    ]
  },
  "podkarpackie": {
    name: "Podkarpackie",
    coordinates: [
      [21.0, 50.8], [23.5, 50.5], [22.8, 49.2], [21.5, 49.0], [21.0, 50.8]
    ]
  },
  "podlaskie": {
    name: "Podlaskie",
    coordinates: [
      [22.0, 54.2], [24.1, 54.0], [24.1, 52.5], [22.5, 52.8], [22.0, 53.5],
      [22.0, 54.2]
    ]
  },
  "pomorskie": {
    name: "Pomorskie",
    coordinates: [
      [16.8, 54.8], [19.5, 54.7], [19.2, 53.8], [17.8, 53.8], [17.0, 54.2],
      [16.8, 54.8]
    ]
  },
  "slaskie": {
    name: "Śląskie",
    coordinates: [
      [18.4, 50.8], [19.5, 50.5], [19.2, 49.8], [18.5, 49.5], [18.0, 50.0],
      [18.4, 50.8]
    ]
  },
  "swietokrzyskie": {
    name: "Świętokrzyskie",
    coordinates: [
      [19.8, 51.5], [21.5, 51.2], [21.0, 50.2], [19.5, 50.5], [19.8, 51.5]
    ]
  },
  "warminsko-mazurskie": {
    name: "Warmińsko-Mazurskie",
    coordinates: [
      [19.2, 54.5], [22.5, 54.5], [22.0, 53.2], [20.5, 53.2], [19.5, 53.8],
      [19.2, 54.5]
    ]
  },
  "zachodniopomorskie": {
    name: "Zachodniopomorskie",
    coordinates: [
      [14.2, 54.4], [16.5, 54.5], [17.0, 53.8], [15.5, 53.0], [14.2, 53.5],
      [14.2, 54.4]
    ]
  }
};
