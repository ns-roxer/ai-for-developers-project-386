# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM golang:1.26-alpine AS backend-build

WORKDIR /src

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .

RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# Stage 3: Runtime
FROM alpine:3.23

RUN apk add --no-cache ca-certificates tzdata

COPY --from=backend-build /server /server
COPY --from=frontend-build /app/frontend/dist /public

ENV STATIC_DIR=/public
ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["/server"]
