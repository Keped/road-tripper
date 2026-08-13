import { RouteData, SavedRouteSummary } from '../types';
import { generatePoisForRoute } from './poiGeneratorService';

const API_BASE = '/api/routes';

function normalizeRouteData(data: any): RouteData {
  const baseRoute: RouteData = {
    ...data,
    pois: Array.isArray(data?.pois) ? data.pois : [],
    polyline: Array.isArray(data?.polyline) ? data.polyline : [],
  };

  if (!baseRoute.pois || baseRoute.pois.length === 0) {
    baseRoute.pois = generatePoisForRoute(baseRoute);
  }

  return baseRoute;
}

export async function fetchSavedRoutes(): Promise<SavedRouteSummary[]> {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching saved routes:', err);
    return [];
  }
}

export async function fetchRouteById(id: string): Promise<RouteData | null> {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return normalizeRouteData(data);
  } catch (err) {
    console.error(`Error fetching route ${id}:`, err);
    return null;
  }
}

export async function importRouteFromUrl(url: string, name?: string): Promise<RouteData> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, name }),
  });

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `Failed to import route (HTTP ${res.status})`);
  }

  return normalizeRouteData(data);
}

export async function updateRouteName(id: string, name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to update route name');
}

export async function deleteSavedRoute(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete route');
}
