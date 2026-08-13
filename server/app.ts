import { Hono } from 'hono';
import { routesRouter } from './routes/routes.js';
import { authRouter, getExpectedToken } from './routes/auth.js';

export const app = new Hono();

// Enable CORS cleanly without relying on Node IncomingMessage headers.get
app.use('/*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Goog-Api-Key');
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }
  await next();
});

// Mount Auth routes
app.route('/api/auth', authRouter);

// Protect API routes with Bearer token middleware
app.use('/api/routes/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const expectedToken = getExpectedToken();
  if (authHeader !== `Bearer ${expectedToken}` && authHeader !== `Basic ${expectedToken}`) {
    return c.json({ error: 'Unauthorized access' }, 401);
  }
  await next();
});

// Mount API routes
app.route('/api/routes', routesRouter);

// Health check endpoint
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));
