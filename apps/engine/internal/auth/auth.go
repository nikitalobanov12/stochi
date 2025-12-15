package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNoAuthHeader    = errors.New("no authorization header")
	ErrInvalidToken    = errors.New("invalid or expired token")
	ErrSessionNotFound = errors.New("session not found")
)

// Session represents a user session from the database
type Session struct {
	ID        string
	UserID    string
	Token     string
	ExpiresAt time.Time
}

// Middleware provides authentication middleware for HTTP handlers
type Middleware struct {
	pool *pgxpool.Pool
}

// NewMiddleware creates a new auth middleware instance
func NewMiddleware(pool *pgxpool.Pool) *Middleware {
	return &Middleware{pool: pool}
}

// ValidateRequest validates the authorization header and returns the user ID
func (m *Middleware) ValidateRequest(r *http.Request) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", ErrNoAuthHeader
	}

	// Expect "Bearer <token>" format
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", ErrInvalidToken
	}

	token := parts[1]
	return m.ValidateToken(r.Context(), token)
}

// ValidateToken validates a session token and returns the user ID
func (m *Middleware) ValidateToken(ctx context.Context, token string) (string, error) {
	var session Session

	query := `
		SELECT id, user_id, token, expires_at
		FROM session
		WHERE token = $1
	`

	err := m.pool.QueryRow(ctx, query, token).Scan(
		&session.ID,
		&session.UserID,
		&session.Token,
		&session.ExpiresAt,
	)
	if err != nil {
		return "", ErrSessionNotFound
	}

	// Check if session has expired
	if time.Now().After(session.ExpiresAt) {
		return "", ErrInvalidToken
	}

	return session.UserID, nil
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
