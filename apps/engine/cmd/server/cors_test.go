package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCorsMiddleware_AllowsConfiguredOrigin(t *testing.T) {
	h := corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}), []string{"https://stochi.app"})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	req.Header.Set("Origin", "https://stochi.app")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Header().Get("Access-Control-Allow-Origin") != "https://stochi.app" {
		t.Fatalf("expected allow-origin header for configured origin")
	}
}

func TestCorsMiddleware_DoesNotReflectDisallowedOrigin(t *testing.T) {
	h := corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}), []string{"https://stochi.app"})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	req.Header.Set("Origin", "https://evil.example")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatalf("expected no allow-origin header for disallowed origin")
	}
}

func TestCorsMiddleware_HandlesPreflightForAllowedOrigin(t *testing.T) {
	h := corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}), []string{"https://stochi.app"})

	req := httptest.NewRequest(http.MethodOptions, "/api/analyze", nil)
	req.Header.Set("Origin", "https://stochi.app")
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected preflight status 200, got %d", rr.Code)
	}
}
