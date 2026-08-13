import { app } from '../server/app.js';

export const config = {
  runtime: 'nodejs',
};

export function GET(req: Request) {
  return app.fetch(req);
}

export function POST(req: Request) {
  return app.fetch(req);
}

export function PATCH(req: Request) {
  return app.fetch(req);
}

export function DELETE(req: Request) {
  return app.fetch(req);
}

export function OPTIONS(req: Request) {
  return app.fetch(req);
}
