/**
 * Resolves short links (e.g. maps.app.goo.gl) to full Google Maps URLs via HTTP HEAD/GET request redirect tracking
 */
export async function resolveGoogleMapsUrl(inputUrl: string): Promise<string> {
  let url = inputUrl.trim();

  // If it's a short link or redirect link
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps') || url.includes('g.co/maps')) {
    try {
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (response.url) {
        url = response.url;
      }
    } catch {
      // Fallback: try GET request
      try {
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        if (response.url) {
          url = response.url;
        }
      } catch (err) {
        console.error('Failed to resolve short URL redirect:', err);
      }
    }
  }

  return url;
}

export interface ParsedRouteParams {
  origin: string;
  destination: string;
  waypoints: string[];
}

/**
 * Extracts origin, destination, and waypoints from Google Maps directions URLs
 * e.g., https://www.google.com/maps/dir/?api=1&origin=Chicago,IL&destination=Santa+Monica,CA&waypoints=Amarillo,TX|Albuquerque,NM
 * or path-based URLs: https://www.google.com/maps/dir/Chicago,+IL/Santa+Monica,+CA/...
 */
export function parseGoogleMapsUrl(urlStr: string): ParsedRouteParams | null {
  try {
    const urlObj = new URL(urlStr);

    // 1. Try URL Query parameters format: /maps/dir/?api=1&origin=...&destination=...&waypoints=...
    const originParam = urlObj.searchParams.get('origin');
    const destParam = urlObj.searchParams.get('destination');
    const waypointsParam = urlObj.searchParams.get('waypoints');

    if (originParam && destParam) {
      const waypoints = waypointsParam ? waypointsParam.split('|').filter(Boolean) : [];
      return {
        origin: originParam,
        destination: destParam,
        waypoints,
      };
    }

    // 2. Try path-based format: /maps/dir/Origin/Way1/Way2/Destination/@lat,lng,z...
    const pathname = urlObj.pathname;
    if (pathname.includes('/dir/')) {
      const parts = pathname
        .split('/dir/')[1]
        .split('/')
        .map((p) => decodeURIComponent(p.replace(/\+/g, ' ')))
        .filter((p) => p && !p.startsWith('@') && !p.startsWith('data='));

      if (parts.length >= 2) {
        const origin = parts[0];
        const destination = parts[parts.length - 1];
        const waypoints = parts.slice(1, parts.length - 1);
        return { origin, destination, waypoints };
      }
    }

    return null;
  } catch (err) {
    console.error('Error parsing Google Maps URL:', err);
    return null;
  }
}
