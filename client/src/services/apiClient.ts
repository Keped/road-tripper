import { RouteData, SavedRouteSummary } from '../types';
import { generatePoisForRouteAsync } from './poiGeneratorService';
import { getAuthToken } from './authService';

const API_BASE = '/api/routes';

function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = { ...customHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function normalizeRouteData(data: any): Promise<RouteData> {
  const baseRoute: RouteData = {
    ...data,
    pois: Array.isArray(data?.pois) ? data.pois : [],
    polyline: Array.isArray(data?.polyline) ? data.polyline : [],
  };

  if (!baseRoute.pois || baseRoute.pois.length === 0) {
    baseRoute.pois = await generatePoisForRouteAsync(baseRoute);
  }

  return baseRoute;
}

export async function fetchSavedRoutes(): Promise<SavedRouteSummary[]> {
  try {
    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });
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
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return await normalizeRouteData(data);
  } catch (err) {
    console.error(`Error fetching route ${id}:`, err);
    return null;
  }
}

export async function importRouteFromUrl(url: string, name?: string): Promise<RouteData> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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

  return await normalizeRouteData(data);
}

export async function updateRouteName(id: string, name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to update route name');
}

export async function deleteSavedRoute(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete route');
}
