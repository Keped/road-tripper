import { POI, POICategory, RouteData } from '../types';
import { getHaversineDistanceMeters } from '../utils/distance';

interface WikiGeosearchItem {
  pageid: number;
  title: string;
  lat: number;
  lon: number;
  dist: number;
}

interface WikiSummaryResponse {
  pageid?: number;
  title: string;
  description?: string;
  extract?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
}

/**
 * Categorize a Wikipedia landmark based on keywords in title & description
 */
function categorizeWikiItem(title: string, extract: string, description: string): { category: POICategory; icon: string } {
  const text = `${title} ${description} ${extract}`.toLowerCase();

  if (text.match(/park|castle|fort|battle|ancient|church|monastery|temple|monument|museum|ruin|tomb|roman|crusader|historic|heritage/)) {
    return { category: 'historic', icon: '🏰' };
  }
  if (text.match(/mountain|hill|lookout|cliff|valley|peak|view|lake|river|gorge|canyon|forest|nature|ridge/)) {
    return { category: 'hiddenGems', icon: '📍' };
  }
  if (text.match(/market|bazaar|town|village|winery|brewery|farm|bakery|restaurant|bistro|cafe/)) {
    return { category: 'markets', icon: '🎪' };
  }
  if (text.match(/pass|strait|highway|bridge|viaduct|interchange|tunnel|grade|slope/)) {
    return { category: 'hazards', icon: '⚠️' };
  }

  return { category: 'podcasts', icon: '🎙️' };
}

/**
 * 100% Real-World Dynamic POI Engine
 * Uses Wikipedia Geosearch API & REST Summaries to fetch REAL historical landmarks,
 * place names, and authentic historical stories along ANY route polyline in the world.
 */
export async function generatePoisForRouteAsync(route: RouteData): Promise<POI[]> {
  if (route.pois && route.pois.length > 0) {
    return route.pois;
  }

  const poly = route.polyline;
  if (!poly || poly.length < 2) return [];

  // Calculate cumulative distances along polyline
  const cumDistMeters: number[] = [0];
  for (let i = 1; i < poly.length; i++) {
    const seg = getHaversineDistanceMeters(poly[i - 1], poly[i]);
    cumDistMeters.push(cumDistMeters[i - 1] + seg);
  }

  const totalDistMeters = cumDistMeters[cumDistMeters.length - 1];
  if (totalDistMeters === 0) return [];

  // Sample 5 to 7 checkpoints along the route
  const targetCount = Math.min(7, Math.max(5, Math.floor(totalDistMeters / 10000)));
  const sampledCoords: Array<{ coord: [number, number]; distKm: number }> = [];

  for (let k = 1; k <= targetCount; k++) {
    const targetDist = (k / (targetCount + 1)) * totalDistMeters;
    let idx = 0;
    while (idx < cumDistMeters.length - 1 && cumDistMeters[idx] < targetDist) {
      idx++;
    }
    sampledCoords.push({
      coord: poly[idx],
      distKm: Math.round(cumDistMeters[idx] / 1000),
    });
  }

  const headers = { 'User-Agent': 'RoadPulse-App/1.0 (contact@roadpulse.app)' };
  const pois: POI[] = [];
  const seenTitles = new Set<string>();

  // Query Wikipedia Geosearch for each checkpoint concurrently
  const wikiPromises = sampledCoords.map(async (sample, i) => {
    const [lat, lon] = sample.coord;
    try {
      const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=5000&gslimit=5&format=json`;
      const geoRes = await fetch(geoUrl, { headers });
      if (!geoRes.ok) return null;

      const geoData = await geoRes.json();
      const items: WikiGeosearchItem[] = geoData.query?.geosearch || [];
      if (items.length === 0) return null;

      // Select first item that hasn't been seen yet
      const selectedItem = items.find((item) => !seenTitles.has(item.title.toLowerCase())) || items[0];
      seenTitles.add(selectedItem.title.toLowerCase());

      // Fetch page summary
      const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(selectedItem.title)}`;
      const sumRes = await fetch(sumUrl, { headers });
      if (!sumRes.ok) return null;

      const summary: WikiSummaryResponse = await sumRes.json();
      if (!summary.extract || summary.extract.length < 20) return null;

      const { category, icon } = categorizeWikiItem(
        summary.title,
        summary.extract || '',
        summary.description || ''
      );

      const poiLatLng: [number, number] = summary.coordinates
        ? [summary.coordinates.lat, summary.coordinates.lon]
        : sample.coord;

      const titleClean = summary.title;
      const subtitle = summary.description ? summary.description : `Landmark at ${sample.distKm} km`;

      const poiObj: POI = {
        id: `wiki-${summary.pageid || i}-${Date.now()}`,
        name: titleClean,
        category,
        title: `${titleClean} — ${subtitle}`,
        summary: summary.extract,
        detail: `${summary.extract}\n\nLocation: ${titleClean} (${sample.distKm} km from ${route.origin || 'origin'}). Coordinates: [${poiLatLng[0].toFixed(4)}, ${poiLatLng[1].toFixed(4)}].`,
        latLng: poiLatLng,
        icon,
        externalUrl: summary.content_urls?.desktop?.page,
        distanceFromStartKm: sample.distKm,
      };

      return poiObj;
    } catch (err) {
      console.warn(`Wikipedia fetch failed for checkpoint ${sample.distKm}km:`, err);
      return null;
    }
  });

  const results = await Promise.all(wikiPromises);
  results.forEach((poi) => {
    if (poi) pois.push(poi);
  });

  return pois;
}

/**
 * Synchronous fallback wrapper
 */
export function generatePoisForRoute(route: RouteData): POI[] {
  return route.pois || [];
}
