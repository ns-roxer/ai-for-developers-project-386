package config

import (
	"os"
	"time"
)

type Config struct {
	Port               string
	DatabaseURL        string
	CORSAllowedOrigins string
	LogLevel           string
	ShutdownTimeout    time.Duration
}

func Load() (Config, error) {
	cfg := Config{
		Port:               getEnvOrDefault("PORT", "8080"),
		DatabaseURL:        getEnvOrDefault("DATABASE_URL", "postgres://callbooking:callbooking@postgres:5432/callbooking?sslmode=disable"),
		CORSAllowedOrigins: getEnvOrDefault("CORS_ALLOWED_ORIGINS", "*"),
		LogLevel:           getEnvOrDefault("LOG_LEVEL", "info"),
		ShutdownTimeout:    parseDurationOrDefault("SHUTDOWN_TIMEOUT", 5*time.Second),
	}

	return cfg, nil
}

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseDurationOrDefault(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return fallback
	}
	return d
}
