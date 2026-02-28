package auth

import (
	"context"
	"crypto/subtle"
	"errors"
	"log"
	"net/http"
	"strings"
)

var (
	ErrNoAuthHeader  = errors.New("no authorization header")
	ErrInvalidKey    = errors.New("invalid internal key")
	ErrNoUserID      = errors.New("no user ID provided")
	ErrInvalidUserID = errors.New("invalid user ID")
)

// Middleware provides authentication middleware for HTTP handlers
type Middleware struct {
	internalKey string
}

// NewMiddleware creates a new auth middleware instance
func NewMiddleware(internalKey string) *Middleware {
	return &Middleware{internalKey: internalKey}
}

// ValidateRequest validates the internal service request
// Expects:
// - X-Internal-Key header with the shared secret
// - X-User-ID header with the authenticated user's ID
func (m *Middleware) ValidateRequest(r *http.Request) (string, error) {
	// Validate internal key
	internalKey := strings.TrimSpace(r.Header.Get("X-Internal-Key"))
	if internalKey == "" {
		return "", ErrNoAuthHeader
	}

	if m.internalKey == "" || !secureEqual(internalKey, m.internalKey) {
		return "", ErrInvalidKey
	}

	// Get user ID from header
	userID := strings.TrimSpace(r.Header.Get("X-User-ID"))
	if userID == "" {
		return "", ErrNoUserID
	}

	if !isValidUserID(userID) {
		return "", ErrInvalidUserID
	}

	return userID, nil
}

func secureEqual(left string, right string) bool {
	if len(left) != len(right) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(left), []byte(right)) == 1
}

func isValidUserID(userID string) bool {
	if len(userID) > 128 {
		return false
	}

	for _, char := range userID {
		if char < 32 || char == 127 {
			return false
		}
	}

	return true
}

// Protect wraps an HTTP handler with authentication
func (m *Middleware) Protect(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := m.ValidateRequest(r)
		if err != nil {
			log.Printf("auth rejected request method=%s path=%s reason=%v", r.Method, r.URL.Path, err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"error":"unauthorized"}`))
			return
		}

		// Add user ID to context
		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next(w, r.WithContext(ctx))
	}
}

// Context key for user ID
type contextKey string

const userIDKey contextKey = "userID"

// GetUserID retrieves the user ID from the request context
func GetUserID(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(userIDKey).(string)
	return userID, ok
}
