package config

import (
	"os"
	"strings"
)

// Config holds the application configuration
type Config struct {
	Port           string
	DatabaseURL    string
	InternalKey    string // Shared secret for internal service-to-service auth
	AllowedOrigins []string
}

// Load reads configuration from environment variables
func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		Port:           port,
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		InternalKey:    os.Getenv("INTERNAL_KEY"),
		AllowedOrigins: parseAllowedOrigins(os.Getenv("ALLOWED_ORIGINS")),
	}
}

func parseAllowedOrigins(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return []string{}
	}

	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin == "" {
			continue
		}
		origins = append(origins, origin)
	}

	return origins
}
