export interface POI {
  id: string;
  name: string;
  category: 'historic' | 'markets' | 'hazards' | 'podcasts' | 'hiddenGems';
  title: string;
  summary: string;
  detail: string;
  latLng: [number, number];
  icon: string;
  externalUrl?: string;
  distanceFromStartKm?: number;
}

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

function getHaversineDistanceMeters(point1: [number, number], point2: [number, number]): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(point2[0] - point1[0]);
  const dLng = toRad(point2[1] - point1[1]);
  const lat1 = toRad(point1[0]);
  const lat2 = toRad(point2[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function categorizeWikiItem(title: string, extract: string, description: string): { category: POI['category']; icon: string } {
  const text = `${title} ${description} ${extract}`.toLowerCase();

  if (text.match(/park|castle|fort|battle|ancient|church|monastery|temple|monument|museum|ruin|tomb|roman|crusader|historic|heritage|memorial/)) {
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
 * Server-side Wikipedia & Nominatim POI Generator
 * Discovers real-world historical landmarks, town names, and lead extracts for any route.
 */
export async function generatePoisForRouteAsyncServer(
  origin: string,
  destination: string,
  polyline: [number, number][],
  totalDistanceKm: number
): Promise<POI[]> {
  if (!polyline || polyline.length < 2) return [];

  // Calculate cumulative distances along polyline
  const cumDistMeters: number[] = [0];
  for (let i = 1; i < polyline.length; i++) {
    const seg = getHaversineDistanceMeters(polyline[i - 1], polyline[i]);
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
      coord: polyline[idx],
      distKm: Math.round(cumDistMeters[idx] / 1000),
    });
  }

  const headers = { 'User-Agent': 'RoadPulse-App/1.0 (contact@roadpulse.app)' };
  const pois: POI[] = [];
  const seenTitles = new Set<string>();

  const wikiPromises = sampledCoords.map(async (sample, i) => {
    const [lat, lon] = sample.coord;
    try {
      // 1. Query Wikipedia Geosearch
      const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=5000&gslimit=5&format=json`;
      const geoRes = await fetch(geoUrl, { headers });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const items: WikiGeosearchItem[] = geoData.query?.geosearch || [];
        
        const selectedItem = items.find((item) => !seenTitles.has(item.title.toLowerCase()));
        if (selectedItem) {
          seenTitles.add(selectedItem.title.toLowerCase());

          // Fetch Wikipedia summary
          const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(selectedItem.title)}`;
          const sumRes = await fetch(sumUrl, { headers });
          if (sumRes.ok) {
            const summary: WikiSummaryResponse = await sumRes.json();
            if (summary.extract && summary.extract.length >= 20) {
              const { category, icon } = categorizeWikiItem(
                summary.title,
                summary.extract,
                summary.description || ''
              );

              const poiLatLng: [number, number] = summary.coordinates
                ? [summary.coordinates.lat, summary.coordinates.lon]
                : sample.coord;

              const titleClean = summary.title;
              const subtitle = summary.description ? summary.description : `${sample.distKm} km from ${origin}`;

              return {
                id: `wiki-${summary.pageid || i}-${Date.now()}`,
                name: titleClean,
                category,
                title: `${titleClean} — ${subtitle}`,
                summary: summary.extract,
                detail: `${summary.extract}\n\nLocated near ${titleClean} (${sample.distKm} km along ${origin} to ${destination}). Coordinates: [${poiLatLng[0].toFixed(4)}, ${poiLatLng[1].toFixed(4)}].`,
                latLng: poiLatLng,
                icon,
                externalUrl: summary.content_urls?.desktop?.page,
                distanceFromStartKm: sample.distKm,
              } as POI;
            }
          }
        }
      }

      // 2. Nominatim Reverse Geocoding Fallback if Wikipedia had no article nearby
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`;
      const nomRes = await fetch(nomUrl, { headers });
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        const addr = nomData.address || {};
        const placeName = addr.tourism || addr.historic || addr.suburb || addr.town || addr.village || addr.city || nomData.display_name?.split(',')[0];
        
        if (placeName) {
          return {
            id: `nom-${i}-${Date.now()}`,
            name: placeName,
            category: 'hiddenGems',
            title: `${placeName} — Local Waypoint (${sample.distKm} km)`,
            summary: `Approaching ${placeName} along the route from ${origin} to ${destination}.`,
            detail: `Waypoint situated in ${placeName} (${sample.distKm} km mark). Coordinates: [${lat.toFixed(4)}, ${lon.toFixed(4)}].`,
            latLng: sample.coord,
            icon: '📍',
            distanceFromStartKm: sample.distKm,
          } as POI;
        }
      }
    } catch (err) {
      console.warn(`Server POI fetch failed for ${sample.distKm}km:`, err);
    }
    return null;
  });

  const results = await Promise.all(wikiPromises);
  results.forEach((poi) => {
    if (poi) pois.push(poi);
  });

  return pois;
}
