import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { routesRouter } from './routes/routes.js';

export const app = new Hono();

// Enable CORS
app.use('/*', cors());

// Mount API routes
app.route('/api/routes', routesRouter);

// Health check endpoint
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));
