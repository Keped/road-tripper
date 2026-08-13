import { POI, POICategory, RouteData } from '../types';
import { getHaversineDistanceMeters } from '../utils/distance';

const CATEGORY_TEMPLATES: Array<{
  category: POICategory;
  icon: string;
  getTitle: (origin: string, dest: string, distKm: number, idx: number) => string;
  getSummary: (origin: string, dest: string, distKm: number) => string;
  getDetail: (origin: string, dest: string, distKm: number, coord: [number, number]) => string;
}> = [
  {
    category: 'historic',
    icon: '🏰',
    getTitle: (_origin, _dest, distKm) => `Historical Landmark & Heritage Site (${distKm} km)`,
    getSummary: (origin, dest, distKm) =>
      `Approaching a key historical heritage site located ${distKm} km along the route from ${origin} to ${dest}.`,
    getDetail: (origin, dest, distKm, coord) =>
      `Historic landmark situated ${distKm} km along the corridor between ${origin} and ${dest}. Coordinates: ${coord[0].toFixed(4)}, ${coord[1].toFixed(4)}.`,
  },
  {
    category: 'podcasts',
    icon: '🎙️',
    getTitle: (_origin, _dest, _distKm, idx) => `Audio Guide Episode #${idx}: Regional Stories`,
    getSummary: (origin, dest, distKm) =>
      `Audio Guide Episode: Local history and cultural heritage along the transit to ${dest} (${distKm} km mark).`,
    getDetail: (origin, dest, distKm) =>
      `Explore historical narratives, cultural insights, and regional background for travellers heading towards ${dest}.`,
  },
  {
    category: 'markets',
    icon: '🎪',
    getTitle: (_origin, _dest, distKm) => `Local Rest Stop & Farmers Market (${distKm} km)`,
    getSummary: (_origin, dest, distKm) =>
      `Popular roadside market and local refreshment stop ${distKm} km before ${dest}.`,
    getDetail: (_origin, dest, distKm) =>
      `Features fresh regional produce, local artisanal goods, espresso bars, and travel amenities.`,
  },
  {
    category: 'hazards',
    icon: '⚠️',
    getTitle: (_origin, _dest, distKm) => `Road Advisory & Terrain Caution (${distKm} km)`,
    getSummary: (_origin, _dest, distKm) =>
      `Caution: Elevation change, steep incline, or heavy traffic merge zone ${distKm} km ahead.`,
    getDetail: (_origin, _dest, distKm) =>
      `Driver advisory: Exercise caution due to mountain curves, grade changes, or lane convergence.`,
  },
  {
    category: 'hiddenGems',
    icon: '📍',
    getTitle: (_origin, _dest, distKm) => `Scenic Panorama Lookout (${distKm} km)`,
    getSummary: (_origin, dest, distKm) =>
      `Scenic pullout and elevated nature viewpoint offering panoramic views towards ${dest}.`,
    getDetail: (_origin, dest, distKm, coord) =>
      `Ideal location for photography, birdwatching, and scenic views of the surrounding landscape at [${coord[0].toFixed(4)}, ${coord[1].toFixed(4)}].`,
  },
];

/**
 * 100% Algorithmic POI Generator
 * Dynamically computes POIs along any polyline path for any route in the world.
 */
export function generatePoisForRoute(route: RouteData): POI[] {
  if (route.pois && route.pois.length > 0) {
    return route.pois;
  }

  const poly = route.polyline;
  if (!poly || poly.length < 2) return [];

  // Calculate cumulative distances along the polyline
  const cumDistMeters: number[] = [0];
  for (let i = 1; i < poly.length; i++) {
    const segmentDist = getHaversineDistanceMeters(poly[i - 1], poly[i]);
    cumDistMeters.push(cumDistMeters[i - 1] + segmentDist);
  }

  const totalDistMeters = cumDistMeters[cumDistMeters.length - 1];
  if (totalDistMeters === 0) return [];

  // Determine number of POIs based on route length (between 4 and 8 POIs)
  const targetCount = Math.min(8, Math.max(4, Math.floor(totalDistMeters / 12000)));

  const originName = route.origin || 'Origin';
  const destName = route.destination || 'Destination';

  const pois: POI[] = [];

  for (let k = 1; k <= targetCount; k++) {
    const targetDistMeters = (k / (targetCount + 1)) * totalDistMeters;

    // Find the polyline index closest to targetDistMeters
    let pointIdx = 0;
    while (pointIdx < cumDistMeters.length - 1 && cumDistMeters[pointIdx] < targetDistMeters) {
      pointIdx++;
    }

    const coord = poly[pointIdx];
    const distKm = Math.round(cumDistMeters[pointIdx] / 1000);

    const template = CATEGORY_TEMPLATES[(k - 1) % CATEGORY_TEMPLATES.length];

    pois.push({
      id: `dyn-poi-${k}-${Date.now()}`,
      name: template.getTitle(originName, destName, distKm, k),
      category: template.category,
      title: template.getTitle(originName, destName, distKm, k),
      summary: template.getSummary(originName, destName, distKm),
      detail: template.getDetail(originName, destName, distKm, coord),
      latLng: coord,
      icon: template.icon,
      distanceFromStartKm: distKm,
    });
  }

  return pois;
}
