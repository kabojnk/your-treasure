export const COLORS = {
  text: '#333333',
  background: '#fcd0a1',
  backgroundLight: '#fde4c8',
  backgroundDark: '#e8b87a',
  accent: '#b1b695',
  link: '#a690a4',
  linkHighContrast: '#5e4b56',
  sky: '#afd2e9',
} as const;

export const MAP_DEFAULTS = {
  center: { lat: 47.5, lng: -122.0 },
  zoom: 7,
  mapTypeId: 'hybrid' as const,
} as const;

export const PNW_BOUNDS = {
  north: 51.0,
  south: 45.5,
  west: -125.5,
  east: -118.0,
} as const;
