package config

import (
	"fmt"
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
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	cfg := Config{
		Port:               getEnvOrDefault("PORT", "8080"),
		DatabaseURL:        dbURL,
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
