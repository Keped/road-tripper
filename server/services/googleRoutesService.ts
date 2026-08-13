import { ParsedRouteParams } from './urlResolverService.js';

export interface RouteComputationResult {
  origin: string;
  destination: string;
  waypoints: string[];
  distanceKm: number;
  durationMin: number;
  polyline: [number, number][]; // Array of [lat, lng] points
}

/**
 * Computes route using Google Routes API if GOOGLE_ROUTES_API_KEY is configured,
 * otherwise falls back to OSRM (OpenStreetMap Routing) so app functions smoothly in both cases.
 */
export async function computeRoute(params: ParsedRouteParams): Promise<RouteComputationResult> {
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;

  if (apiKey && apiKey !== 'YOUR_GOOGLE_ROUTES_API_KEY_HERE') {
    try {
      return await computeWithGoogleRoutes(params, apiKey);
    } catch (err) {
      console.warn('Google Routes API failed, falling back to OSRM:', err);
      return await computeWithOSRM(params);
    }
  } else {
    console.log('GOOGLE_ROUTES_API_KEY not set. Using OSRM routing engine.');
    return await computeWithOSRM(params);
  }
}

async function computeWithGoogleRoutes(params: ParsedRouteParams, apiKey: string): Promise<RouteComputationResult> {
  const intermediates = params.waypoints.map((wp) => ({
    address: wp,
  }));

  const requestBody = {
    origin: { address: params.origin },
    destination: { address: params.destination },
    intermediates,
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_UNAWARE',
    polylineEncoding: 'GEO_JSON_LINESTRING',
  };

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Routes API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route) {
    throw new Error('No route returned by Google Routes API');
  }

  const distanceKm = Math.round(((route.distanceMeters || 0) / 1000) * 10) / 10;
  const durationMin = Math.round(parseInt(route.duration?.replace('s', '') || '0') / 60);

  // GeoJSON LineString coordinates are [lng, lat] -> convert to [lat, lng] for Leaflet
  const geoJsonCoords: [number, number][] = route.polyline?.geoJsonLinestring?.coordinates || [];
  const polyline: [number, number][] = geoJsonCoords.map(([lng, lat]) => [lat, lng]);

  return {
    origin: params.origin,
    destination: params.destination,
    waypoints: params.waypoints,
    distanceKm,
    durationMin,
    polyline,
  };
}

/**
 * Fallback routing using Nominatim Geocoding + OSRM Public Routing
 */
async function computeWithOSRM(params: ParsedRouteParams): Promise<RouteComputationResult> {
  // Geocode points
  const pointsToGeocode = [params.origin, ...params.waypoints, params.destination];
  const coords: { lat: number; lng: number }[] = [];

  for (const query of pointsToGeocode) {
    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(geoUrl, {
      headers: { 'User-Agent': 'RoadPulse-App/1.0' },
    });
    const items = await res.json();
    if (items && items.length > 0) {
      coords.push({ lat: parseFloat(items[0].lat), lng: parseFloat(items[0].lon) });
    } else {
      throw new Error(`Could not find location for: "${query}"`);
    }
  }

  // OSRM expects: lon,lat;lon,lat...
  const osrmCoordStr = coords.map((c) => `${c.lng},${c.lat}`).join(';');
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmCoordStr}?overview=full&geometries=geojson`;

  const osrmRes = await fetch(osrmUrl);
  if (!osrmRes.ok) {
    throw new Error('OSRM routing request failed');
  }

  const osrmData = await osrmRes.json();
  const osrmRoute = osrmData.routes?.[0];
  if (!osrmRoute) {
    throw new Error('No route returned from OSRM');
  }

  const distanceKm = Math.round(((osrmRoute.distance || 0) / 1000) * 10) / 10;
  const durationMin = Math.round((osrmRoute.duration || 0) / 60);

  const rawCoords: [number, number][] = osrmRoute.geometry.coordinates; // [lng, lat]
  const polyline: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

  return {
    origin: params.origin,
    destination: params.destination,
    waypoints: params.waypoints,
    distanceKm,
    durationMin,
    polyline,
  };
}
