import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { app } from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve client production static files if client build exists
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use('/*', serveStatic({ root: './client/dist' }));
}

const port = Number(process.env.PORT) || 3001;
console.log(`🚀 RoadPulse server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
