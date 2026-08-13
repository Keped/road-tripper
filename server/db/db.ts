import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbClient: Client;

function initDatabase(): Client {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    console.log('🔗 Connecting to Turso Cloud SQLite Database...');
    return createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
  }

  // Local / Serverless file storage fallback
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
