import { Hono } from 'hono';

export const authRouter = new Hono();

export function getExpectedToken(): string {
  const user = process.env.APP_USERNAME || 'admin';
  const pass = process.env.APP_PASSWORD || 'roadpulse2026';
  return Buffer.from(`${user}:${pass}`).toString('base64');
}

// POST /api/auth/login
authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    const expectedUser = process.env.APP_USERNAME || 'admin';
    const expectedPass = process.env.APP_PASSWORD || 'roadpulse2026';

    if (username === expectedUser && password === expectedPass) {
      const token = getExpectedToken();
      return c.json({ success: true, token, username: expectedUser });
    }

    return c.json({ error: 'Invalid username or password' }, 401);
  } catch {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// GET /api/auth/session
authRouter.get('/session', (c) => {
  const authHeader = c.req.header('Authorization');
  const expectedToken = getExpectedToken();

  if (authHeader && (authHeader === `Bearer ${expectedToken}` || authHeader === `Basic ${expectedToken}`)) {
    return c.json({ authenticated: true, username: process.env.APP_USERNAME || 'admin' });
  }

  return c.json({ authenticated: false }, 401);
});
