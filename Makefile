.PHONY: frontend backend db setup start stop logs build-frontend lint-frontend mock test-e2e test-e2e-headed test-e2e-ui

# Start PostgreSQL and backend via Docker Compose
db:
	docker compose up -d postgres

# Run backend with Docker Compose
backend:
	docker compose up --build backend

# Install frontend dependencies and run dev server
frontend:
	cd frontend && npm install && npm run dev

# Start Prism mock server against the OpenAPI contract (port 8080)
mock:
	cd frontend && npm run mock

# Start all services (DB + backend in Docker, frontend locally)
start:
	docker compose up --build -d
	cd frontend && npm install && npm run dev

# Stop Docker Compose services
stop:
	docker compose down

# Show Docker Compose logs
logs:
	docker compose logs -f

# Build frontend for production
build-frontend:
	cd frontend && npm run build

# Lint frontend
lint-frontend:
	cd frontend && npm run lint

# Run Playwright E2E tests (services must be running)
test-e2e:
	npx playwright test

# Run Playwright E2E tests in headed mode (visible browser)
test-e2e-headed:
	npx playwright test --headed

# Open Playwright test UI runner
test-e2e-ui:
	npx playwright test --ui

