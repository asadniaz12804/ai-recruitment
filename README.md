# AI Recruitment Platform

Intelligent hiring platform — monorepo with a React client and Express API server.

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

Edit the `.env` files if you need to change any defaults.

### 4. Start development servers

```bash
npm run dev
```

This starts both apps concurrently:

- **Client:** http://localhost:5173
- **Server:** http://localhost:5000

### 5. Verify

```bash
curl http://localhost:5000/health
# → { "status": "ok", "timestamp": "..." }
```

## Available Scripts (root)

| Script                | Description                         |
| --------------------- | ----------------------------------- |
| `npm run dev`         | Start client + server concurrently  |
| `npm run dev:client`  | Start only the Vite dev server      |
| `npm run dev:server`  | Start only the Express dev server   |
| `npm run build`       | Build both client and server        |
| `npm run lint`        | Lint client code                    |
| `npm run install:all` | Install deps in client/ and server/ |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 7, React Router 7
- **Backend:** Express 4, TypeScript, Pino logger
- **Infrastructure:** MongoDB 7, Redis 7 (via Docker Compose)
