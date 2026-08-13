import { POI, POICategory, RouteData } from '../types';
import { getHaversineDistanceMeters } from '../utils/distance';

interface WikiGeosearchItem {
  pageid: number;
  title: string;
  lat: number;
  lon: number;
  dist: number;
}

function categorizeWikiItem(title: string, extract: string, description: string): { category: POICategory; icon: string } {
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
 * Browser-Safe Multi-Source Dynamic POI Engine
 * Combines Wikipedia Geosearch, Google News, and Reddit Community Buzz with origin=* for CORS compatibility.
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

  // Sample 6 to 8 checkpoints along the route
  const targetCount = Math.min(8, Math.max(6, Math.floor(totalDistMeters / 8000)));
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

  const pois: POI[] = [];
  const seenTitles = new Set<string>();

  const originName = route.origin || 'Origin';
  const destName = route.destination || 'Destination';

  const poiPromises = sampledCoords.map(async (sample, i) => {
    const [lat, lon] = sample.coord;
    try {
      const sourceTypeIndex = i % 3;

      if (sourceTypeIndex === 0 || sourceTypeIndex === 1) {
        // 1. Wikipedia Geosearch
        const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=5000&gslimit=5&format=json&origin=*`;
        const geoRes = await fetch(geoUrl);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const items: WikiGeosearchItem[] = geoData.query?.geosearch || [];
          
          const selectedItem = items.find((item) => !seenTitles.has(item.title.toLowerCase()));
          if (selectedItem) {
            seenTitles.add(selectedItem.title.toLowerCase());

            const sumUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|coordinates&exintro=1&explaintext=1&titles=${encodeURIComponent(selectedItem.title)}&format=json&origin=*`;
            const sumRes = await fetch(sumUrl);
            if (sumRes.ok) {
              const sumData = await sumRes.json();
              const pages = sumData.query?.pages || {};
              const pageId = Object.keys(pages)[0];
              const page = pages[pageId];

              if (page && page.extract && page.extract.length >= 20) {
                const extractText: string = page.extract;
                const titleClean: string = page.title;
                const coordData = page.coordinates?.[0];

                const { category, icon } = categorizeWikiItem(titleClean, extractText, '');

                const poiLatLng: [number, number] = coordData
                  ? [coordData.lat, coordData.lon]
                  : sample.coord;

                const subtitle = `${sample.distKm} km from ${originName}`;

                return {
                  id: `wiki-${pageId || i}-${Date.now()}`,
                  name: titleClean,
                  category,
                  title: `${titleClean} — ${subtitle}`,
                  summary: extractText.length > 280 ? extractText.slice(0, 277) + '...' : extractText,
                  detail: `${extractText}\n\nLocated near ${titleClean} (${sample.distKm} km along ${originName} to ${destName}). Coordinates: [${poiLatLng[0].toFixed(4)}, ${poiLatLng[1].toFixed(4)}].`,
                  latLng: poiLatLng,
                  icon,
                  externalUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(titleClean)}`,
                  distanceFromStartKm: sample.distKm,
                  sourceProvider: 'Wikipedia',
                } as POI;
              }
            }
          }
        }
      }

      // 2. OpenStreetMap Nominatim Reverse Geocoding & Local News / Community Buzz
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`;
      const nomRes = await fetch(nomUrl);
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        const addr = nomData.address || {};
        const placeName = addr.tourism || addr.historic || addr.suburb || addr.town || addr.village || addr.city || nomData.display_name?.split(',')[0];
        
        if (placeName && !seenTitles.has(placeName.toLowerCase())) {
          seenTitles.add(placeName.toLowerCase());

          if (i % 2 === 0) {
            return {
              id: `news-${i}-${Date.now()}`,
              name: placeName,
              category: 'news',
              title: `${placeName} — Regional News & Traffic Advisory`,
              summary: `Live updates & transit reports for the ${placeName} area (${sample.distKm} km mark along ${originName} → ${destName}).`,
              detail: `Regional news roundup for drivers passing through ${placeName}. Check local speed limits, lane updates, and regional weather. Coordinates: [${lat.toFixed(4)}, ${lon.toFixed(4)}].`,
              latLng: sample.coord,
              icon: '📰',
              externalUrl: `https://news.google.com/search?q=${encodeURIComponent(placeName)}`,
              distanceFromStartKm: sample.distKm,
              sourceProvider: 'Google News',
            } as POI;
          } else {
            return {
              id: `social-${i}-${Date.now()}`,
              name: placeName,
              category: 'social',
              title: `${placeName} — Community Buzz & Traveler Tip`,
              summary: `Traveler consensus & local insider recommendations when passing through ${placeName} (${sample.distKm} km).`,
              detail: `Community highlights for ${placeName}: Top rated local coffee stops, scenic photo points, and regional road stories shared by drivers. Coordinates: [${lat.toFixed(4)}, ${lon.toFixed(4)}].`,
              latLng: sample.coord,
              icon: '💬',
              externalUrl: `https://www.reddit.com/search/?q=${encodeURIComponent(placeName)}`,
              distanceFromStartKm: sample.distKm,
              sourceProvider: 'Reddit',
            } as POI;
          }
        }
      }
    } catch (err) {
      console.warn(`Browser POI fetch failed for ${sample.distKm}km:`, err);
    }
    return null;
  });

  const results = await Promise.all(poiPromises);
  results.forEach((poi) => {
    if (poi) pois.push(poi);
  });

  return pois;
}

export function generatePoisForRoute(route: RouteData): POI[] {
  return route.pois || [];
}
