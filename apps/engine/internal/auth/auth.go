package auth

import (
	"context"
	"errors"
	"net/http"
)

var (
	ErrNoAuthHeader = errors.New("no authorization header")
	ErrInvalidKey   = errors.New("invalid internal key")
	ErrNoUserID     = errors.New("no user ID provided")
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
	internalKey := r.Header.Get("X-Internal-Key")
	if internalKey == "" {
		return "", ErrNoAuthHeader
	}

	if m.internalKey == "" || internalKey != m.internalKey {
		return "", ErrInvalidKey
	}

	// Get user ID from header
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		return "", ErrNoUserID
	}

	return userID, nil
}

// Protect wraps an HTTP handler with authentication
func (m *Middleware) Protect(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := m.ValidateRequest(r)
		if err != nil {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
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
