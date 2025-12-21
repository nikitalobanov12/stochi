package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nikitalobanov12/stochi/apps/engine/internal/auth"
	"github.com/nikitalobanov12/stochi/apps/engine/internal/config"
	"github.com/nikitalobanov12/stochi/apps/engine/internal/db"
	"github.com/nikitalobanov12/stochi/apps/engine/internal/handlers"
)

func main() {
	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to database
	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("Connected to database")

	// Create middleware and handlers
	authMiddleware := auth.NewMiddleware(cfg.InternalKey)
	handler := handlers.NewHandler(pool, authMiddleware)

	// Setup routes
	mux := http.NewServeMux()

	// Health check (unauthenticated)
	mux.HandleFunc("GET /health", handler.Health)

	// Protected API endpoints
	mux.HandleFunc("POST /api/analyze", authMiddleware.Protect(handler.Analyze))
	mux.HandleFunc("POST /api/timing", authMiddleware.Protect(handler.CheckTiming))

	// Create server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      corsMiddleware(mux),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		log.Println("Shutting down server...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
	}()

	log.Printf("Server starting on port %s", cfg.Port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}

	log.Println("Server stopped")
}

// corsMiddleware adds CORS headers for cross-origin requests
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow requests from the web app
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Internal-Key, X-User-ID")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
