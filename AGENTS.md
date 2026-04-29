# AI Agents Workflow: Call Booking Project

This document defines the roles, responsibilities, and step-by-step instructions for AI agents to build the "Call Booking" application from scratch using a **Design First** approach.

## 🤖 Agent Roles

### 1. The Architect (Lead Agent)
* **Responsibility:** Project structure, TypeSpec definitions, and technical decisions.
* **Focus:** API Contract consistency and project alignment.

### 2. The Frontend Engineer
* **Responsibility:** Building the UI based on the API contract.
* **Focus:** React/Next.js (or chosen stack), UX, and API integration.

### 3. The Backend Engineer
* **Responsibility:** Server logic, database management, and API implementation.
* **Focus:** Business logic, validation, and Dockerization.

### 4. The QA & DevOps Agent
* **Responsibility:** End-to-end testing and containerization.
* **Focus:** Ensuring the app runs in Docker and follows the 14-day booking logic.

### The "Design First" Loop
1. **Architect** updates `main.tsp`.
2. **TypeSpec** compiles to `openapi.yaml`.
3. **Prism** runs: `npx @stoplight/prism-cli mock openapi.yaml`.
4. **Frontend Engineer** builds UI against the Prism mock server.
5. **Backend Engineer** implements the Go server to match the spec.
6. **QA & DevOps Agent** tests the full flow and ensures Dockerization.

---

## 🛠 Tech Stack Recommendations (AI-Friendly)
* **Contract:** TypeSpec (compiler to OpenAPI)
* **Backend (Golang)**
- Use **Standard Library** or **Chi** for routing.
- Use **sqlc** or **Ent** if a database is added (very type-safe for AI).
- Ensure the project structure follows standard Go project layouts.
* **Frontend (TypeScript + Vite)**
- UI: Use **shadcn/ui** (default to Radix primitives).
- Data Fetching: Use **TanStack Query (React Query)** to sync with the API.
- Mocking: Use **Prism** to serve the `openapi.yaml` during frontend construction.
* **Database:** PostgreSQL
* **Deployment:** Docker + Docker Compose

---

## 📁 Project Structure

```
├── Dockerfile                  # Combined multi-stage: frontend + backend → single image
├── docker-compose.yml          # postgres + backend services
├── Makefile                    # Dev workflow shortcuts (see below)
├── package.json                # Root: Playwright + MCP dev deps
├── tsconfig.json               # Root: covers playwright.config.ts + e2e/**
├── playwright.config.ts        # E2E config with auto webServer startup
├── .mcp.json                   # MCP server config for AI agents
├── contract/                   # API-first contract (TypeSpec → OpenAPI)
│   ├── main.tsp                # TypeSpec source of truth
│   ├── openapi.yaml            # Canonical OpenAPI spec (also in tsp-output/)
│   ├── tspconfig.yaml
│   ├── package.json            # build: npx tsp compile .
│   └── tsp-output/@typespec/openapi3/openapi.yaml
├── backend/                   # Go API server
│   ├── Dockerfile              # Multi-stage: golang:1.26-alpine → alpine:3.23
│   ├── go.mod                  # module github.com/hexlet/call-booking/backend
│   └── cmd/server/main.go     # Entrypoint (migrations + graceful shutdown)
│   └── internal/
│       ├── config/config.go    # Env-based config (DATABASE_URL, PORT, etc.)
│       ├── handler/handler.go  # Chi router + HTTP handlers + SPA serving
│       ├── service/service.go  # Business logic (14-day window, slot generation)
│       ├── repository/repository.go  # PostgreSQL queries via squirrel
│       ├── models/models.go    # Shared domain structs
│       └── migrations/         # Embedded SQL migrations (embed.FS)
│           ├── embed.go
│           ├── 001_init.up.sql
│           └── 002_seed.up.sql
├── frontend/                  # React + Vite + TypeScript
│   ├── package.json
│   ├── vite.config.ts          # Proxy /api → localhost:8080
│   └── src/
│       ├── api/client.ts       # Axios client (baseURL: /api)
│       ├── api/types.ts        # TypeScript interfaces matching OpenAPI models
│       ├── hooks/              # TanStack Query hooks per endpoint
│       ├── pages/              # Route pages
│       │   ├── EventTypeListPage.tsx   # /
│       │   ├── BookingPage.tsx         # /book/:eventTypeId
│       │   └── admin/
│       │       ├── CreateEventTypePage.tsx  # /admin/event-types/new
│       │       └── UpcomingBookingsPage.tsx # /admin/bookings
│       ├── components/Layout.tsx  # Shared layout with nav + Toaster
│       └── components/ui/      # shadcn/ui components
└── e2e/                       # Playwright E2E tests + helpers
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/event-types` | List all event types |
| `GET` | `/event-types/{eventTypeId}/available-slots?date=YYYY-MM-DD` | Available slots for a date |
| `POST` | `/bookings` | Create a booking |
| `POST` | `/admin/event-types` | Create an event type |
| `GET` | `/admin/upcoming-bookings` | List future bookings with event type name |

Error responses use `{ "code": "...", "message": "..." }` format. Service errors map to: `404` (NOT_FOUND), `409` (CONFLICT), `422` (VALIDATION_ERROR), `500` (INTERNAL_ERROR).

---

## 🏗 Backend Conventions

### Architecture: `handler → service → repository`
- **handler** (`internal/handler/`): HTTP parsing, Chi routing, CORS, JSON encoding. Maps `service.ErrNotFound/ErrConflict/ErrInvalidRequest` to HTTP status codes.
- **service** (`internal/service/`): Business rules — 14-day booking window, working hours (09:00–17:00 UTC), 30-min slot boundaries, input validation.
- **repository** (`internal/repository/`): Database access using **pgx/v5** pool + **squirrel** query builder with `sq.Dollar` placeholders.
- **models** (`internal/models/`): Plain structs shared across layers. JSON tags use camelCase.

### Dual Route Registration
All API routes are registered at **both** the root (`/event-types`, `/bookings`, etc.) and under the `/api` prefix (`/api/event-types`, etc.). This enables:
- Direct access on `:8080` (used by E2E test helpers and Docker health checks)
- Proxied access from the Vite dev server (`/api` → `:8080`, path rewritten to strip `/api`)

### SPA Serving (Combined Dockerfile)
The root-level `Dockerfile` builds both frontend and backend into one image. When `STATIC_DIR` env var is set, the backend serves static files from that directory and falls back to `index.html` for client-side routes (SPA mode). See `spaHandler()` in `handler.go`.

### Key Libraries
- **Routing:** `go-chi/chi/v5` with `middleware.RealIP`, `RequestID`, `Recoverer`
- **Database driver:** `jackc/pgx/v5/pgxpool`
- **Query builder:** `Masterminds/squirrel` (always use `psql` builder with `sq.Dollar`)
- **CORS:** `go-chi/cors`
- **IDs:** `google/uuid`

### Migrations
- Embedded via `//go:embed *.sql` in `internal/migrations/embed.go`
- Applied at startup in `cmd/server/main.go` using a custom `schema_migrations` table
- Overlap prevention uses PostgreSQL `EXCLUDE USING gist` constraint on `bookings`

### Environment Variables
| Variable | Default | Required |
|----------|---------|----------|
| `DATABASE_URL` | — | ✅ |
| `PORT` | `8080` | |
| `CORS_ALLOWED_ORIGINS` | `*` | |
| `LOG_LEVEL` | `info` | |
| `SHUTDOWN_TIMEOUT` | `5s` | |
| `STATIC_DIR` | — | | Only for combined image (root Dockerfile) |

---

## 🎨 Frontend Conventions

### Stack: React 19 + Vite 8 + TailwindCSS 4
- **Routing:** `react-router-dom` v7 with `BrowserRouter`
- **Data fetching:** TanStack Query v5 — one custom hook per endpoint in `src/hooks/`
- **HTTP client:** Axios with `baseURL: "/api"` (Vite proxy rewrites `/api` → backend)
- **Forms:** `react-hook-form` + `zod` validation via `@hookform/resolvers`
- **UI components:** shadcn/ui in `src/components/ui/` (button, calendar, card, input, label, skeleton, sonner, table)
- **Icons:** `lucide-react`
- **Date handling:** `date-fns`
- **Toasts:** `sonner`
- **Path alias:** `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`)

### Frontend Pages & Routes
| Route | Page | Description |
|-------|------|-------------|
| `/` | `EventTypeListPage` | Browse available event types |
| `/book/:eventTypeId` | `BookingPage` | Select date/slot and book |
| `/admin/event-types/new` | `CreateEventTypePage` | Admin: create event type |
| `/admin/bookings` | `UpcomingBookingsPage` | Admin: view upcoming bookings |

---

## 🐳 Running with Docker

```bash
# Start PostgreSQL + backend
docker compose up --build

# Backend available at http://localhost:8080
# Frontend dev server (run separately)
cd frontend && npm install && npm run dev
# Frontend available at http://localhost:5173
```

### Makefile Targets
| Target | Description |
|--------|-------------|
| `make db` | Start only PostgreSQL via Docker Compose |
| `make backend` | Build and run backend (attached) |
| `make frontend` | Install deps + run Vite dev server |
| `make mock` | Start Prism mock server on :8080 |
| `make start` | Start all (DB + backend in Docker, frontend locally) |
| `make stop` | Stop Docker Compose services |
| `make logs` | Tail Docker Compose logs |
| `make build-frontend` | Production build of frontend |
| `make lint-frontend` | Run ESLint on frontend |
| `make test-e2e` | Run Playwright E2E tests (headless) |
| `make test-e2e-headed` | Run E2E tests with visible browser |
| `make test-e2e-ui` | Open Playwright interactive UI |

### Docker Compose Services
- **postgres**: `postgres:16-alpine`, DB name/user/pass: `callbooking`
- **backend**: Built from `backend/Dockerfile`, depends on postgres healthcheck

---

## 📝 Contract Workflow

```bash
cd contract
npm install
npm run build   # npx tsp compile .
# Output: tsp-output/@typespec/openapi3/openapi.yaml
```

The TypeSpec definition in `contract/main.tsp` is the single source of truth for the API contract. After compiling, the output lands in `tsp-output/@typespec/openapi3/openapi.yaml`. A copy at `contract/openapi.yaml` serves as the canonical reference used by Prism mocking (`npm run mock` in frontend) and documentation.

### Seeded Data
Migration `002_seed.up.sql` inserts three event types on first startup:
- "15 Minute Meeting" (15 min)
- "30 Minute Meeting" (30 min)
- "60 Minute Meeting" (60 min)

E2E tests rely on these seeded records (see `SEED_EVENT_TYPES` in `e2e/helpers.ts`).

---

## 🧪 E2E Testing

### Stack: Playwright + Chromium
End-to-end tests live in the `e2e/` directory and are configured via `playwright.config.ts` at the project root. Root `tsconfig.json` covers `e2e/` and `playwright.config.ts`.

### Playwright Config
- `fullyParallel: false`, `workers: 1` — tests run sequentially (shared DB state)
- `timeout: 60_000`, `expect.timeout: 10_000`
- `webServer` auto-starts Docker backend + Vite frontend (reuses existing in non-CI)
- Backend health check: `http://localhost:8080/event-types`
- `BASE_URL` env var overrides frontend URL (default: `http://localhost:5173`)

### Running Tests

```bash
# Ensure services are running first
docker compose up --build -d
cd frontend && npm run dev &

# Run all E2E tests (headless)
make test-e2e          # or: npx playwright test

# Run in headed mode (see the browser)
make test-e2e-headed   # or: npx playwright test --headed

# Open Playwright interactive UI
make test-e2e-ui       # or: npx playwright test --ui
```

### Test Files
| File | Coverage |
|------|----------|
| `e2e/event-type-list.spec.ts` | Home page: seeded event types render, Book buttons link correctly, nav links present, duration display, descriptions |
| `e2e/booking-flow.spec.ts` | Full booking: pick date → pick slot → fill form → confirm screen, 14-day calendar constraint, date switching, form validation, back link navigation |
| `e2e/booking-conflict.spec.ts` | Double-booking conflict: booked slot removed from UI, API returns 409 on duplicate |
| `e2e/create-event-type.spec.ts` | Admin: create event type form, validation errors (empty fields, invalid duration), redirect to home, loading state |
| `e2e/upcoming-bookings.spec.ts` | Admin: bookings table displays API-created bookings, table headers, sort order, event type name column |
| `e2e/navigation.spec.ts` | Full navigation: header links, Book button, back links, logo/brand link |

### Helpers (`e2e/helpers.ts`)
- API helpers that talk directly to the backend on `:8080` (bypass Vite proxy) for test setup
- `getEventTypes()`, `createBookingAPI()`, `getAvailableSlots()`, `createEventType()`
- Date helpers: `getTomorrowDate()`, `getDatePlusDays(n)`

---

## 🔌 MCP Servers (AI Agent Browser Tools)

The project includes two MCP (Model Context Protocol) servers configured in `.mcp.json` for AI-driven browser interaction during development and debugging:

### Playwright MCP (`@playwright/mcp`)
- **Source:** https://github.com/microsoft/playwright-mcp
- **Purpose:** Lets AI agents launch a browser, navigate pages, click elements, fill forms, take screenshots, and run accessibility checks.
- **Usage:** Automatically available when MCP-compatible AI tools read `.mcp.json`.

### Chrome DevTools MCP (`chrome-devtools-mcp`)
- **Source:** https://github.com/ChromeDevTools/chrome-devtools-mcp
- **Purpose:** Lets AI agents inspect DOM, monitor network requests, read console logs, and analyze performance via Chrome DevTools Protocol.
- **Usage:** Connects to a running Chrome instance with remote debugging enabled.

### MCP Configuration (`.mcp.json`)
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--browser", "chromium"],
      "env": {
        "BASE_URL": "http://localhost:5173"
      }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"],
      "env": {}
    }
  }
}
```

