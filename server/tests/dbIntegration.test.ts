import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables from root .env if present
function loadEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...vals] = trimmed.split('=');
        if (key && vals.length > 0) {
          process.env[key.trim()] = vals.join('=').trim();
        }
      }
    }
  }
}

loadEnv();

describe('Local DB Integration Verification', () => {
  const testRouteId = 'test-db-route-' + Date.now();

  it('verifies local file-based SQLite database CRUD operations', async () => {
    const dbDir = path.resolve(__dirname, '../db_storage_test');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'test_roadpulse.db');

    const client = createClient({
      url: `file:${dbPath}`,
    });

    // 1. Ensure Table Schema
    await client.execute(`
      CREATE TABLE IF NOT EXISTS routes (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        origin       TEXT NOT NULL,
        destination  TEXT NOT NULL,
        waypoints    TEXT NOT NULL DEFAULT '[]',
        distance_km  REAL NOT NULL,
        duration_min REAL NOT NULL,
        polyline     TEXT NOT NULL,
        source_url   TEXT,
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 2. Insert test route
    await client.execute({
      sql: `INSERT INTO routes (id, name, origin, destination, waypoints, distance_km, duration_min, polyline, source_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        testRouteId,
        'Test Local SQLite Route',
        'Chicago, IL',
        'St. Louis, MO',
        JSON.stringify(['Springfield, IL']),
        480.7,
        280,
        JSON.stringify([[41.8781, -87.6298]]),
        'https://maps.google.com/test',
      ],
    });

    // 3. Query inserted route
    const selectRes = await client.execute({
      sql: 'SELECT * FROM routes WHERE id = ?',
      args: [testRouteId],
    });

    assert.equal(selectRes.rows.length, 1, 'Should find 1 inserted route in local SQLite');
    const row = selectRes.rows[0];
    assert.equal(row.id, testRouteId);
    assert.equal(row.name, 'Test Local SQLite Route');

    // 4. Update route
    await client.execute({
      sql: 'UPDATE routes SET name = ? WHERE id = ?',
      args: ['Updated Local SQLite Route', testRouteId],
    });

    const updatedRes = await client.execute({
      sql: 'SELECT name FROM routes WHERE id = ?',
      args: [testRouteId],
    });
    assert.equal(updatedRes.rows[0].name, 'Updated Local SQLite Route');

    // 5. Delete route & cleanup
    await client.execute({
      sql: 'DELETE FROM routes WHERE id = ?',
      args: [testRouteId],
    });

    const finalRes = await client.execute({
      sql: 'SELECT * FROM routes WHERE id = ?',
      args: [testRouteId],
    });
    assert.equal(finalRes.rows.length, 0, 'Route should be deleted from local SQLite');

    // Cleanup test db files
    client.close();
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      if (fs.existsSync(dbDir)) fs.rmdirSync(dbDir);
    } catch {}
  });

  it('verifies Turso Cloud SQLite database connectivity and CRUD operations', async () => {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

    if (!tursoUrl || !tursoAuthToken) {
      console.log('Skipping Turso Cloud DB test: TURSO_DATABASE_URL not found in .env');
      return;
    }

    const client = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });

    // 1. Ensure Table Schema on Turso Cloud
    await client.execute(`
      CREATE TABLE IF NOT EXISTS routes (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        origin       TEXT NOT NULL,
        destination  TEXT NOT NULL,
        waypoints    TEXT NOT NULL DEFAULT '[]',
        distance_km  REAL NOT NULL,
        duration_min REAL NOT NULL,
        polyline     TEXT NOT NULL,
        source_url   TEXT,
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 2. Insert test route on Turso Cloud
    const tursoRouteId = 'turso-test-route-' + Date.now();
    await client.execute({
      sql: `INSERT INTO routes (id, name, origin, destination, waypoints, distance_km, duration_min, polyline, source_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        tursoRouteId,
        'Turso Cloud Integration Test Route',
        'San Francisco, CA',
        'Los Angeles, CA',
        JSON.stringify(['Monterey, CA']),
        615.4,
        360,
        JSON.stringify([[37.7749, -122.4194]]),
        'https://maps.google.com/turso-test',
      ],
    });

    // 3. Select inserted route from Turso Cloud
    const selectRes = await client.execute({
      sql: 'SELECT * FROM routes WHERE id = ?',
      args: [tursoRouteId],
    });

    assert.equal(selectRes.rows.length, 1, 'Should find inserted route in Turso Cloud SQLite');
    assert.equal(selectRes.rows[0].name, 'Turso Cloud Integration Test Route');

    // 4. Update route on Turso Cloud
    await client.execute({
      sql: 'UPDATE routes SET name = ? WHERE id = ?',
      args: ['Updated Turso Cloud Test Route', tursoRouteId],
    });

    const updatedRes = await client.execute({
      sql: 'SELECT name FROM routes WHERE id = ?',
      args: [tursoRouteId],
    });
    assert.equal(updatedRes.rows[0].name, 'Updated Turso Cloud Test Route');

    // 5. Delete test route from Turso Cloud
    await client.execute({
      sql: 'DELETE FROM routes WHERE id = ?',
      args: [tursoRouteId],
    });

    const verifyDelete = await client.execute({
      sql: 'SELECT * FROM routes WHERE id = ?',
      args: [tursoRouteId],
    });
    assert.equal(verifyDelete.rows.length, 0, 'Test route should be deleted from Turso Cloud SQLite');

    client.close();
  });
});
