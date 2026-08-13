import { handle } from 'hono/vercel';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  const { app } = await import('../server/app.js');
  return handle(app)(req, res);
}
