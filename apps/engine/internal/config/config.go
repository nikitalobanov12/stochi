package config

import (
	"os"
)

// Config holds the application configuration
type Config struct {
	Port        string
	DatabaseURL string
	InternalKey string // Shared secret for internal service-to-service auth
}

// Load reads configuration from environment variables
func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		Port:        port,
		DatabaseURL: os.Getenv("DATABASE_URL"),
		InternalKey: os.Getenv("INTERNAL_KEY"),
	}
}
