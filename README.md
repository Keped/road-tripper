# 🚗 RoadPulse — Contextual Route Intelligence & Road Trip Co-Pilot

RoadPulse is a real-time contextual co-pilot web application and Progressive Web App (PWA) designed for road trips in unfamiliar regions. It tracks driving progress (via real mobile GPS or simulated driving) and automatically delivers location intelligence about historical landmarks, pop-up events, hazard zones, audio stories, and hidden gems along the route.

---

## ⚡ Deployment to Vercel (Available on your Phone Anywhere)

The project is fully configured for zero-friction Vercel deployment (supporting both static PWA client and Serverless Hono backend).

### Option A: Deploy via Vercel CLI (Fastest)

```bash
# 1. Install Vercel CLI if you haven't already
npm install -g vercel

# 2. Run vercel from the project root folder
vercel
```

Follow the CLI prompts (accept defaults). Vercel will build the React app and deploy the Hono serverless backend automatically.

### Option B: Deploy via Vercel Web Dashboard (Git Push)

1. Push this repository to **GitHub / GitLab / Bitbucket**.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Vercel will automatically detect `vercel.json`. Click **Deploy**.

---

## ⚙️ Environment Variables (Optional)

In your Vercel Project Settings → **Environment Variables**, you can optionally set:

| Variable | Description | Default / Fallback |
|---|---|---|
| `GOOGLE_ROUTES_API_KEY` | Google Routes API Key for exact route polylines from Google Maps links | Falls back to free OpenStreetMap OSRM routing |
| `TURSO_DATABASE_URL` | Turso Cloud SQLite database URL (e.g. `libsql://your-db.turso.io`) | Falls back to serverless SQLite `/tmp` storage |
| `TURSO_AUTH_TOKEN` | Turso authentication token | — |

---

## 📱 Mobile & Car Touchscreen Usage

1. **Install as PWA**: Open your Vercel deployment URL on your mobile browser (Safari on iOS or Chrome on Android) and tap **Share → Add to Home Screen**.
2. **Background Navigation with Waze/Google Maps**: When driving, switch to **Live GPS Mode**. RoadPulse initializes an audio session lock so GPS updates continue even when Waze is on screen.
3. **Hands-free Voice Alerts**: Spoken voice callouts play directly through your car's Bluetooth or CarPlay audio channel.

---

## 💻 Local Development

```bash
# Install dependencies
npm run install:all

# Start client & server concurrently
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:3001`
