# AI Recruitment Platform

Intelligent hiring platform — monorepo with a React client and Express API server.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Local Development](#local-development)
4. [Environment Variable Checklist](#environment-variable-checklist)
5. [Production Deployment](#production-deployment)
   - [Backend → Render](#backend--render)
   - [Frontend → Vercel](#frontend--vercel)
   - [MongoDB Atlas](#mongodb-atlas)
   - [Upstash Redis](#upstash-redis)
   - [Cloudinary](#cloudinary)
6. [Troubleshooting](#troubleshooting)

---

## Project Structure

```
ai-recruitment/
├── client/          # Vite + React + TypeScript frontend
├── server/          # Express + TypeScript API
├── shared/          # Shared types/utilities (future)
├── docker-compose.yml
├── package.json     # Root scripts (concurrently)
└── README.md
```

## Prerequisites

| Tool                    | Version       |
| ----------------------- | ------------- |
| Node.js                 | >= 20         |
| npm                     | >= 10         |
| Docker & Docker Compose | Latest stable |

## Local Development

### 1. Start infrastructure services

```bash
docker compose up -d
```

This starts:

- **MongoDB** on `localhost:27017`
- **Redis** on `localhost:6379`

### 2. Install dependencies

```bash
# From repo root
npm install
npm run install:all
```

### 3. Configure environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit the `.env` files if you need to change any defaults (the defaults work for local dev).

### 4. Start development servers

```bash
npm run dev
```

This starts both apps concurrently:

- **Client:** http://localhost:5173
- **Server:** http://localhost:5000

### 5. Seed the database (optional)

```bash
npm --prefix server run dev          # make sure server is running
npx --prefix server tsx src/scripts/seed.ts
```

### 6. Verify

```bash
curl http://localhost:5000/health
# → { "status": "ok", "timestamp": "...", "db": "connected" }
```

## Available Scripts (root)

| Script                | Description                         |
| --------------------- | ----------------------------------- |
| `npm run dev`         | Start client + server concurrently  |
| `npm run dev:client`  | Start only the Vite dev server      |
| `npm run dev:server`  | Start only the Express dev server   |
| `npm run build`       | Build both client and server        |
| `npm run lint`        | Lint client code                    |
| `npm run test`        | Run server tests                    |
| `npm run install:all` | Install deps in client/ and server/ |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 7, React Router 7, TanStack Query
- **Backend:** Express 4, TypeScript, Pino logger, BullMQ
- **Database:** MongoDB (Mongoose ODM)
- **Cache/Queue:** Redis (IORedis + BullMQ)
- **AI:** OpenAI API (optional – controlled via `AI_ENABLED`)
- **File Uploads:** Cloudinary

---

## Environment Variable Checklist

### Server (`server/.env`)

| Variable                | Required | Example / Default                                                 | Description                                   |
| ----------------------- | -------- | ----------------------------------------------------------------- | --------------------------------------------- |
| `NODE_ENV`              | Yes      | `production`                                                      | Must be `production` for deployed instances   |
| `PORT`                  | No       | `5000`                                                            | Render sets this automatically                |
| `LOG_LEVEL`             | No       | `info`                                                            | Pino log level                                |
| `MONGODB_URI`           | **Yes**  | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/ai_recruitment` | Atlas connection string                       |
| `REDIS_URL`             | **Yes**  | `rediss://default:xxx@xxx.upstash.io:6379`                        | Upstash Redis URL (note `rediss://` for TLS)  |
| `CORS_ORIGIN`           | **Yes**  | `https://your-app.vercel.app`                                     | Comma-separated allowed frontend origins      |
| `JWT_ACCESS_SECRET`     | **Yes**  | (random 64-char string)                                           | Sign access tokens                            |
| `JWT_REFRESH_SECRET`    | **Yes**  | (random 64-char string)                                           | Sign refresh tokens                           |
| `ACCESS_TOKEN_TTL`      | No       | `15m`                                                             | Access token lifetime                         |
| `REFRESH_TOKEN_TTL`     | No       | `7d`                                                              | Refresh token lifetime                        |
| `COOKIE_SECURE`         | No       | `true`                                                            | Auto-set when `NODE_ENV=production`           |
| `COOKIE_SAMESITE`       | No       | `none`                                                            | Set to `none` for cross-origin deployments    |
| `COOKIE_DOMAIN`         | No       | (blank)                                                           | Set if you want the cookie scoped to a domain |
| `AI_ENABLED`            | No       | `true`                                                            | Enable AI resume parsing & scoring            |
| `OPENAI_API_KEY`        | Cond.    | `sk-...`                                                          | Required when `AI_ENABLED=true`               |
| `OPENAI_MODEL`          | No       | `gpt-4o-mini`                                                     | OpenAI model for AI features                  |
| `CLOUDINARY_CLOUD_NAME` | Cond.    | `my-cloud`                                                        | Required for resume uploads                   |
| `CLOUDINARY_API_KEY`    | Cond.    | `123456789`                                                       | Cloudinary API key                            |
| `CLOUDINARY_API_SECRET` | Cond.    | `abc...`                                                          | Cloudinary API secret                         |
| `MAX_RESUME_SIZE_MB`    | No       | `10`                                                              | Max resume file size in MB                    |

### Client (`client/.env`)

| Variable            | Required | Example                         | Description                              |
| ------------------- | -------- | ------------------------------- | ---------------------------------------- |
| `VITE_API_BASE_URL` | **Yes**  | `https://your-api.onrender.com` | Backend API base URL (no trailing slash) |

---

## Production Deployment

### Backend → Render

> Render is recommended for its free tier and simple deployment. Fly.io works equally well.

#### Step-by-step (Render)

1. **Create a new Web Service** on [render.com](https://render.com/).
2. Connect your GitHub repo and set the **Root Directory** to `server`.
3. Configure:

   | Setting           | Value                          |
   | ----------------- | ------------------------------ |
   | **Runtime**       | Node                           |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm run start`                |
   | **Health Check**  | `/health`                      |

4. Add **all required env vars** from the checklist above in the Render dashboard → Environment.
5. Deploy. Render will build TypeScript via `tsc` and run `node dist/index.js`.

#### Step-by-step (Fly.io)

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. From the `server/` directory:

   ```bash
   fly launch          # follow prompts, choose region
   fly secrets set \
     NODE_ENV=production \
     MONGODB_URI="mongodb+srv://..." \
     REDIS_URL="rediss://..." \
     CORS_ORIGIN="https://your-app.vercel.app" \
     JWT_ACCESS_SECRET="$(openssl rand -hex 32)" \
     JWT_REFRESH_SECRET="$(openssl rand -hex 32)" \
     COOKIE_SAMESITE=none
   fly deploy
   ```

3. Fly automatically detects the `Dockerfile` or uses buildpacks. Add a `fly.toml` if needed:

   ```toml
   [http_service]
     internal_port = 5000
     force_https = true

   [[http_service.checks]]
     path = "/health"
     interval = "10s"
     timeout = "2s"
   ```

---

### Frontend → Vercel

1. **Import project** on [vercel.com](https://vercel.com/) from your GitHub repo.
2. Set the **Root Directory** to `client`.
3. Vercel auto-detects Vite. Configure:

   | Setting           | Value           |
   | ----------------- | --------------- |
   | **Framework**     | Vite            |
   | **Build Command** | `npm run build` |
   | **Output Dir**    | `dist`          |

4. Add the environment variable:

   ```
   VITE_API_BASE_URL=https://your-api.onrender.com
   ```

5. Add a `client/vercel.json` for SPA routing (created automatically, or add manually):

   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```

6. Deploy. Your frontend will be live at `https://your-app.vercel.app`.

> **Netlify alternative:** Use the same build settings. Add a `client/_redirects` file containing `/* /index.html 200`.

---

### MongoDB Atlas

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a **free M0 cluster**.
3. **Database Access** → Add a database user with readWrite permissions.
4. **Network Access** → For Render, add `0.0.0.0/0` (allow all) or Render's static outbound IPs.
5. **Connect** → Choose "Connect your application" → Copy the `mongodb+srv://` URI.
6. Set the URI as `MONGODB_URI` in your server environment.

> **Tip:** Create a separate user with limited privileges for production. Never use admin credentials.

---

### Upstash Redis

BullMQ requires a Redis instance. Upstash provides serverless Redis with a generous free tier.

1. Sign up at [upstash.com](https://upstash.com/).
2. Create a new **Redis database** (choose a region near your server).
3. Copy the **TLS connection string** — it starts with `rediss://` (double `s`).
4. Set it as `REDIS_URL` in your server environment.

> **Important:** Upstash requires TLS (`rediss://`). The IORedis client in this project handles it automatically.

---

### Cloudinary

Resume uploads are stored in Cloudinary (optional — the app works without it, but uploads will fail).

1. Sign up at [cloudinary.com](https://cloudinary.com/).
2. From the **Dashboard**, copy:
   - Cloud Name → `CLOUDINARY_CLOUD_NAME`
   - API Key → `CLOUDINARY_API_KEY`
   - API Secret → `CLOUDINARY_API_SECRET`
3. Set these in your server environment.

---

## Troubleshooting

### Server won't start

| Symptom                              | Cause & Fix                                                               |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `ECONNREFUSED` on MongoDB            | Check `MONGODB_URI`. Ensure Atlas network access allows your server's IP. |
| `ECONNREFUSED` on Redis              | Check `REDIS_URL`. For Upstash use `rediss://` (TLS).                     |
| Port already in use                  | Another process holds the port. Run `lsof -i :5000` or change `PORT`.     |
| `Cannot find module 'dist/index.js'` | Run `npm run build` in `server/` first.                                   |

### CORS errors in browser

- Verify `CORS_ORIGIN` contains the **exact** origin (including protocol, no trailing slash).
- For example: `https://your-app.vercel.app` (not `https://your-app.vercel.app/`).
- If frontend and backend are on different domains, set `COOKIE_SAMESITE=none`.

### Cookies not being sent

- Ensure `COOKIE_SECURE` is `true` (or `NODE_ENV=production`).
- Ensure `COOKIE_SAMESITE=none` when frontend/backend are cross-origin.
- The frontend must send `credentials: "include"` on fetch requests (already set in `api.ts`).
- Check browser DevTools → Application → Cookies to confirm the cookie is stored.

### Health check failing on Render

- Ensure the health check path is set to `/health` (not `/api/health`).
- The endpoint returns `{ "status": "ok" }` even when the DB is down.

### AI features not working

- Set `AI_ENABLED=true` and provide a valid `OPENAI_API_KEY`.
- Ensure Redis is reachable (BullMQ queues require it).

### Resume upload failing

- Verify Cloudinary env vars are set: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Default max file size is 10 MB — adjust via `MAX_RESUME_SIZE_MB`.

---

## License

Private — not open-source.
