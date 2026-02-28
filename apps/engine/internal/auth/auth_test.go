package auth

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestValidateRequest(t *testing.T) {
	middleware := NewMiddleware("super-secret")

	t.Run("rejects missing internal key", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		req.Header.Set("X-User-ID", "user_123")

		_, err := middleware.ValidateRequest(req)
		if err != ErrNoAuthHeader {
			t.Fatalf("expected ErrNoAuthHeader, got %v", err)
		}
	})

	t.Run("rejects invalid internal key", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		req.Header.Set("X-Internal-Key", "wrong-key")
		req.Header.Set("X-User-ID", "user_123")

		_, err := middleware.ValidateRequest(req)
		if err != ErrInvalidKey {
			t.Fatalf("expected ErrInvalidKey, got %v", err)
		}
	})

	t.Run("rejects empty user id", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		req.Header.Set("X-Internal-Key", "super-secret")

		_, err := middleware.ValidateRequest(req)
		if err != ErrNoUserID {
			t.Fatalf("expected ErrNoUserID, got %v", err)
		}
	})

	t.Run("accepts valid request", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		req.Header.Set("X-Internal-Key", "super-secret")
		req.Header.Set("X-User-ID", "user_123")

		userID, err := middleware.ValidateRequest(req)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if userID != "user_123" {
			t.Fatalf("expected user_123, got %s", userID)
		}
	})

	t.Run("rejects malformed user id", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		req.Header.Set("X-Internal-Key", "super-secret")
		req.Header.Set("X-User-ID", strings.Repeat("u", 129))

		_, err := middleware.ValidateRequest(req)
		if err != ErrInvalidUserID {
			t.Fatalf("expected ErrInvalidUserID, got %v", err)
		}
	})
}

func TestProtect_UnauthorizedResponseShape(t *testing.T) {
	middleware := NewMiddleware("super-secret")

	protected := middleware.Protect(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	req := httptest.NewRequest(http.MethodPost, "/api/analyze", nil)
	req.Header.Set("X-Internal-Key", "wrong-key")
	req.Header.Set("X-User-ID", "user_123")
	rr := httptest.NewRecorder()

	protected.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}

	if rr.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("expected JSON content type, got %s", rr.Header().Get("Content-Type"))
	}

	if strings.TrimSpace(rr.Body.String()) != `{"error":"unauthorized"}` {
		t.Fatalf("unexpected body: %s", rr.Body.String())
	}
}
