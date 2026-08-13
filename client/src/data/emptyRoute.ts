import { RouteData } from '../types';

export const DEFAULT_EMPTY_ROUTE: RouteData = {
  id: 'no-active-route',
  name: 'No Active Route',
  origin: 'Import Google Maps Link',
  destination: 'To Start Navigation',
  distanceKm: 0,
  durationMin: 0,
  polyline: [
    [37.7749, -122.4194], // Default San Francisco coordinates
  ],
  pois: [],
};
