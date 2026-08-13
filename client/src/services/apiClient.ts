import { RouteData, SavedRouteSummary } from '../types';

const API_BASE = '/api/routes';

export async function fetchSavedRoutes(): Promise<SavedRouteSummary[]> {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching saved routes:', err);
    return [];
  }
}

export async function fetchRouteById(id: string): Promise<RouteData | null> {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
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

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to import route from URL');
  }

  return data;
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
