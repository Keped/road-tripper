import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { db, RouteRow, ensureSchema } from '../db/db.js';
import { resolveGoogleMapsUrl, parseGoogleMapsUrl } from '../services/urlResolverService.js';
import { computeRoute } from '../services/googleRoutesService.js';
import { generatePoisForRouteAsyncServer } from '../services/poiGeneratorService.js';

export const routesRouter = new Hono();

// GET /api/routes - list all saved routes
routesRouter.get('/', async (c) => {
  await ensureSchema();
  const rs = await db.execute(`
    SELECT id, name, origin, destination, waypoints, distance_km, duration_min, source_url, created_at
    FROM routes
    ORDER BY created_at DESC
  `);

  const routes = rs.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    origin: String(row.origin),
    destination: String(row.destination),
    waypoints: JSON.parse(String(row.waypoints || '[]')),
    distanceKm: Number(row.distance_km),
    durationMin: Number(row.duration_min),
    sourceUrl: row.source_url ? String(row.source_url) : null,
    createdAt: String(row.created_at),
  }));

  return c.json(routes);
});

// GET /api/routes/:id - get single route with polyline and real POIs
routesRouter.get('/:id', async (c) => {
  await ensureSchema();
  const id = c.req.param('id');
  const rs = await db.execute({
    sql: 'SELECT * FROM routes WHERE id = ?',
    args: [id],
  });

  const row = rs.rows[0];
  if (!row) {
    return c.json({ error: 'Route not found' }, 404);
  }

  const origin = String(row.origin);
  const destination = String(row.destination);
  const polyline: [number, number][] = JSON.parse(String(row.polyline));
  const distanceKm = Number(row.distance_km);

  // Discover real-world Wikipedia / Nominatim POIs
  const pois = await generatePoisForRouteAsyncServer(origin, destination, polyline, distanceKm);

  return c.json({
    id: String(row.id),
    name: String(row.name),
    origin,
    destination,
    waypoints: JSON.parse(String(row.waypoints || '[]')),
    distanceKm,
    durationMin: Number(row.duration_min),
    polyline,
    pois,
    sourceUrl: row.source_url ? String(row.source_url) : null,
    createdAt: String(row.created_at),
  });
});

// POST /api/routes - import a new route from Google Maps URL
routesRouter.post('/', async (c) => {
  await ensureSchema();
  try {
    const body = await c.req.json();
    const { url, name } = body;

    if (!url || typeof url !== 'string') {
      return c.json({ error: 'Missing or invalid "url" in request body' }, 400);
    }

    // 1. Resolve short URL if applicable
    const resolvedUrl = await resolveGoogleMapsUrl(url);

    // 2. Parse URL parameters
    const parsedParams = parseGoogleMapsUrl(resolvedUrl);
    if (!parsedParams) {
      return c.json(
        {
          error:
            'Could not extract route information from the URL. Please provide a Google Maps directions URL (e.g. google.com/maps/dir/...)',
        },
        400
      );
    }

    // 3. Compute route (Google Routes API or OSRM fallback)
    const computed = await computeRoute(parsedParams);

    // 4. Save to SQLite database
    const routeId = uuidv4();
    const routeName = name && name.trim() ? name.trim() : `${computed.origin} to ${computed.destination}`;

    await db.execute({
      sql: `INSERT INTO routes (id, name, origin, destination, waypoints, distance_km, duration_min, polyline, source_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        routeId,
        routeName,
        computed.origin,
        computed.destination,
        JSON.stringify(computed.waypoints),
        computed.distanceKm,
        computed.durationMin,
        JSON.stringify(computed.polyline),
        url,
      ],
    });

    // 5. Discover real-world Wikipedia / Nominatim POIs
    const pois = await generatePoisForRouteAsyncServer(
      computed.origin,
      computed.destination,
      computed.polyline,
      computed.distanceKm
    );

    return c.json(
      {
        id: routeId,
        name: routeName,
        origin: computed.origin,
        destination: computed.destination,
        waypoints: computed.waypoints,
        distanceKm: computed.distanceKm,
        durationMin: computed.durationMin,
        polyline: computed.polyline,
        pois,
        sourceUrl: url,
        createdAt: new Date().toISOString(),
      },
      201
    );
  } catch (err: any) {
    console.error('Error importing route:', err);
    return c.json({ error: err.message || 'Failed to import route' }, 500);
  }
});

// PATCH /api/routes/:id - update route name
routesRouter.patch('/:id', async (c) => {
  await ensureSchema();
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name } = body;

  if (!name || typeof name !== 'string') {
    return c.json({ error: 'Missing or invalid "name"' }, 400);
  }

  const result = await db.execute({
    sql: 'UPDATE routes SET name = ? WHERE id = ?',
    args: [name.trim(), id],
  });

  if (result.rowsAffected === 0) {
    return c.json({ error: 'Route not found' }, 404);
  }

  return c.json({ id, name: name.trim() });
});

// DELETE /api/routes/:id - delete saved route
routesRouter.delete('/:id', async (c) => {
  await ensureSchema();
  const id = c.req.param('id');
  const result = await db.execute({
    sql: 'DELETE FROM routes WHERE id = ?',
    args: [id],
  });

  if (result.rowsAffected === 0) {
    return c.json({ error: 'Route not found' }, 404);
  }

  return c.json({ success: true, id });
});
