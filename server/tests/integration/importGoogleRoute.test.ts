import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { app } from '../../app.js';
import { db, ensureSchema } from '../../db/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(__dirname, '../fixtures/googleRoutesResponse.json');

describe('Integration Test: Import Route from Google Maps', () => {
  const originalFetch = globalThis.fetch;
  let googleApiCallCount = 0;

  before(async () => {
    await ensureSchema();

    // Set test API key so computeRoute uses Google Routes provider
    process.env.GOOGLE_ROUTES_API_KEY = 'test-mock-google-api-key';

    // Wrap fetch to intercept Google Routes API calls using recorded SDK response
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (urlStr.includes('routes.googleapis.com')) {
        googleApiCallCount++;

        // If explicitly requested to record, make real network request once and save fixture
        if (process.env.RECORD_FIXTURES === 'true' && process.env.REAL_GOOGLE_ROUTES_API_KEY) {
          const realHeaders = {
            ...(init?.headers || {}),
            'X-Goog-Api-Key': process.env.REAL_GOOGLE_ROUTES_API_KEY,
          };
          const realRes = await originalFetch(input, { ...init, headers: realHeaders });
          const realData = await realRes.json();
          fs.writeFileSync(fixturePath, JSON.stringify(realData, null, 2), 'utf-8');
          return new Response(JSON.stringify(realData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Standard test run: replay recorded SDK response fixture without calling Google API
        const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
        const fixtureData = JSON.parse(fixtureContent);

        return new Response(JSON.stringify(fixtureData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return originalFetch(input, init);
    };
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    googleApiCallCount = 0;
  });

  it('successfully imports a route from Google Maps URL using recorded SDK response', async () => {
    const importPayload = {
      url: 'https://www.google.com/maps/dir/?api=1&origin=Chicago,IL&destination=St.+Louis,MO&waypoints=Springfield,IL',
      name: 'Historic Route 66 Leg 1',
    };

    const response = await app.request('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importPayload),
    });

    assert.equal(response.status, 201, 'Response status should be 201 Created');

    const data = await response.json();

    // Verify response structure & parsed values
    assert.ok(data.id, 'Route ID should be generated');
    assert.equal(data.name, 'Historic Route 66 Leg 1');
    assert.equal(data.origin, 'Chicago,IL');
    assert.equal(data.destination, 'St. Louis,MO');
    assert.deepEqual(data.waypoints, ['Springfield,IL']);
    assert.equal(data.distanceKm, 480.7, 'Distance should match recorded Google API fixture (480.7 km)');
    assert.equal(data.durationMin, 280, 'Duration should match recorded Google API fixture (16805s -> 280m)');

    // Polyline check: GeoJSON [lng, lat] converted to Leaflet [lat, lng]
    assert.ok(Array.isArray(data.polyline), 'Polyline should be an array');
    assert.equal(data.polyline.length > 100, true, 'Real polyline should contain full route coordinate detail');
    assert.deepEqual(data.polyline[0], [41.8832498, -87.63236200000001], 'Polyline point 0 should match real Google GPS coordinate [lat, lng]');

    // Assert that the Google Routes API interceptor was triggered with recorded fixture
    assert.equal(googleApiCallCount, 1, 'Google API mock should be invoked exactly once via recorded fixture');

    // Verify persistence in SQLite database via GET /api/routes/:id
    const getRes = await app.request(`/api/routes/${data.id}`);
    assert.equal(getRes.status, 200, 'GET /api/routes/:id should return 200 OK');
    const savedRoute = await getRes.json();
    assert.equal(savedRoute.id, data.id);
    assert.equal(savedRoute.name, 'Historic Route 66 Leg 1');
  });

  it('returns 400 Bad Request for invalid or non-directions Google Maps URLs', async () => {
    const response = await app.request('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://google.com/search?q=chicago' }),
    });

    assert.equal(response.status, 400);
    const data = await response.json();
    assert.ok(data.error.includes('Could not extract route information'));
    assert.equal(googleApiCallCount, 0, 'Should not attempt route computation for invalid URLs');
  });

  it('returns 400 Bad Request when URL parameter is missing', async () => {
    const response = await app.request('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'No URL Route' }),
    });

    assert.equal(response.status, 400);
    const data = await response.json();
    assert.ok(data.error.includes('Missing or invalid "url"'));
  });
});
