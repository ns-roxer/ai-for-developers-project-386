# Call Booking

A simple "calendar / call booking" application: admins create event types, users pick a date within a 14-day window and book a free 30-minute slot.

### Hexlet tests and linter status:
[![Actions Status](https://github.com/ns-roxer/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/ns-roxer/ai-for-developers-project-386/actions)

## 🌐 Live Demo

The application is deployed on Render and available at:

**https://callbooking.onrender.com** *(replace with the actual URL after the first Render deploy)*

> Render's free plan spins the service down after periods of inactivity, so the first request after a long pause may take ~30 seconds while the container cold-starts.

## 🧱 Stack

- **Backend:** Go 1.26 + Chi + pgx/v5 + squirrel
- **Frontend:** React 19 + Vite 8 + TailwindCSS 4 + shadcn/ui
- **Database:** PostgreSQL 16
- **Contract:** TypeSpec → OpenAPI
- **Container:** Single multi-stage `Dockerfile` that builds frontend + backend and serves both from one Go process on `$PORT`.

## 🐳 Run with Docker (production-style)

The repository contains a top-level `Dockerfile` that builds the frontend, builds the Go backend, and produces a small `alpine` runtime image. The Go server serves the React SPA from `/` and the JSON API from `/api/*` on the port supplied via the `PORT` environment variable.

```bash
# Build the image
docker build -t callbooking .

# Run a postgres + app stack (using docker-compose for local development)
docker compose up --build

# Or run the production image standalone (Postgres must already be available)
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e DATABASE_URL="postgres://user:pass@host:5432/callbooking?sslmode=disable" \
  callbooking
```

The app listens on the port specified by `PORT` and is serving both the SPA and the API. Open [http://localhost:8080](http://localhost:8080).

### Environment Variables

| Variable | Default | Required |
|----------|---------|----------|
| `PORT` | `8080` | ✅ (provided by host) |
| `DATABASE_URL` | — | ✅ |
| `CORS_ALLOWED_ORIGINS` | `*` | |
| `LOG_LEVEL` | `info` | |
| `SHUTDOWN_TIMEOUT` | `5s` | |
| `STATIC_DIR` | `/public` (set in `Dockerfile`) | |

## 🚀 Deploy to Render

The repository ships with a `render.yaml` Blueprint. To deploy:

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint**, connect the repo.
3. Render reads `render.yaml`, provisions a free Postgres database and a Docker web service, and wires `DATABASE_URL` automatically.
4. After the first deploy succeeds, copy the service URL and replace the placeholder in the **Live Demo** section above.

Alternatively, the [Render MCP server](https://render.com/docs/mcp-server) is preconfigured in `.mcp.json` for AI-assisted deployments — set `RENDER_API_KEY` in the environment to enable it.

## 🛠 Local development

See [`AGENTS.md`](./AGENTS.md) for the full architecture, agent workflow, project layout, API contract, and E2E test details.

```bash
# Backend + Postgres
docker compose up --build

# Frontend dev server
cd frontend && npm install && npm run dev
# → http://localhost:5173
```
