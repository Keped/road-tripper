import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface InMemoryRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  waypoints: string;
  distance_km: number;
  duration_min: number;
  polyline: string;
  source_url: string | null;
  created_at: string;
}

const memoryStore: InMemoryRoute[] = [];

function createInMemoryClient(): Client {
  return {
    async execute(stmt: any): Promise<any> {
      const sql = typeof stmt === 'string' ? stmt : stmt?.sql || '';
      const args = typeof stmt === 'object' && Array.isArray(stmt.args) ? stmt.args : [];
      const cleanSql = sql.trim().toUpperCase();

      if (cleanSql.startsWith('CREATE TABLE')) {
        return { rows: [], rowsAffected: 0 };
      }

      if (cleanSql.startsWith('SELECT')) {
        if (cleanSql.includes('WHERE ID =')) {
          const id = args[0];
          const found = memoryStore.find((r) => r.id === id);
          return { rows: found ? [found as any] : [], rowsAffected: found ? 1 : 0 };
        }
        return { rows: [...memoryStore] as any[], rowsAffected: memoryStore.length };
      }

      if (cleanSql.startsWith('INSERT INTO')) {
        const [id, name, origin, destination, waypoints, distance_km, duration_min, polyline, source_url] = args;
        const newRoute: InMemoryRoute = {
          id: String(id),
          name: String(name),
          origin: String(origin),
          destination: String(destination),
          waypoints: String(waypoints),
          distance_km: Number(distance_km),
          duration_min: Number(duration_min),
          polyline: String(polyline),
          source_url: source_url ? String(source_url) : null,
          created_at: new Date().toISOString(),
        };
        memoryStore.unshift(newRoute);
        return { rows: [], rowsAffected: 1 };
      }

      if (cleanSql.startsWith('UPDATE')) {
        const [name, id] = args;
        const target = memoryStore.find((r) => r.id === id);
        if (target) {
          target.name = String(name);
          return { rows: [], rowsAffected: 1 };
        }
        return { rows: [], rowsAffected: 0 };
      }

      if (cleanSql.startsWith('DELETE')) {
        const id = args[0];
        const index = memoryStore.findIndex((r) => r.id === id);
        if (index !== -1) {
          memoryStore.splice(index, 1);
          return { rows: [], rowsAffected: 1 };
        }
        return { rows: [], rowsAffected: 0 };
      }

      return { rows: [], rowsAffected: 0 };
    },
    async batch() {
      return [];
    },
    async transaction() {
      return {} as any;
    },
    close() {},
    closed: false,
    protocol: 'in-memory',
  } as unknown as Client;
}

function initDatabase(): Client {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    try {
      console.log('🔗 Connecting to Turso Cloud SQLite Database...');
      return createClient({
        url: tursoUrl,
        authToken: tursoAuthToken,
      });
    } catch (err) {
      console.warn('Failed to connect to Turso DB, trying local fallback:', err);
    }
  }

  // Local / Serverless file storage fallback
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    const dbDir = isVercel ? '/tmp' : path.join(__dirname, '../../db_storage');

    if (!isVercel && !fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = isVercel ? '/tmp/roadpulse.db' : path.join(dbDir, 'roadpulse.db');
    console.log(`📁 Using local SQLite database at: ${dbPath}`);

    return createClient({
      url: `file:${dbPath}`,
    });
  } catch (err) {
    console.warn('⚠️ Native SQLite driver unavailable in serverless environment. Using in-memory fallback store.');
    return createInMemoryClient();
  }
}

export const db = initDatabase();

// Execute schema creation
export async function ensureSchema(): Promise<void> {
  await db.execute(`
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
}

// Run schema setup asynchronously
ensureSchema().catch((err) => console.error('Failed to initialize DB schema:', err));

export interface RouteRow {
  id: string;
  name: string;
  origin: string;
  destination: string;
  waypoints: string;
  distance_km: number;
  duration_min: number;
  polyline: string;
  source_url: string | null;
  created_at: string;
}
