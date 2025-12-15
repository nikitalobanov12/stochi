package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nikitalobanov12/stochi/apps/engine/internal/auth"
	"github.com/nikitalobanov12/stochi/apps/engine/internal/models"
)

// Handler holds the dependencies for HTTP handlers
type Handler struct {
	pool *pgxpool.Pool
	auth *auth.Middleware
}

// NewHandler creates a new handler instance
func NewHandler(pool *pgxpool.Pool, authMiddleware *auth.Middleware) *Handler {
	return &Handler{
		pool: pool,
		auth: authMiddleware,
	}
}

// Health handles the health check endpoint
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	// Verify database connection
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := h.pool.Ping(ctx); err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "unhealthy",
			"error":  "database connection failed",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
	})
}

// Analyze handles the interaction analysis endpoint
func (h *Handler) Analyze(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if len(req.SupplementIDs) == 0 {
		http.Error(w, `{"error":"supplementIds required"}`, http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	userID, _ := auth.GetUserID(ctx)

	response, err := h.analyzeInteractions(ctx, userID, req)
	if err != nil {
		http.Error(w, `{"error":"analysis failed"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) analyzeInteractions(ctx context.Context, userID string, req models.AnalyzeRequest) (*models.AnalyzeResponse, error) {
	// Fetch supplements
	supplements, err := h.getSupplements(ctx, req.SupplementIDs)
	if err != nil {
		return nil, err
	}

	// Fetch interactions for the given supplements
	interactions, err := h.getInteractions(ctx, req.SupplementIDs)
	if err != nil {
		return nil, err
	}

	// Separate warnings from synergies
	var warnings, synergies []models.InteractionWarning
	for _, interaction := range interactions {
		warning := models.InteractionWarning{
			ID:        interaction.ID,
			Type:      interaction.Type,
			Severity:  interaction.Severity,
			Mechanism: interaction.Mechanism,
			Source:    h.supplementToInfo(supplements[interaction.SourceID]),
			Target:    h.supplementToInfo(supplements[interaction.TargetID]),
		}

		if interaction.Type == models.InteractionTypeSynergy {
			synergies = append(synergies, warning)
		} else {
			warnings = append(warnings, warning)
		}
	}

	// Determine traffic light status
	status := h.calculateStatus(warnings)

	response := &models.AnalyzeResponse{
		Status:    status,
		Warnings:  warnings,
		Synergies: synergies,
	}

	// Optionally include timing analysis
	if req.IncludeTiming && userID != "" {
		timingWarnings, err := h.checkTimingWarnings(ctx, userID, req.SupplementIDs)
		if err == nil {
			response.TimingWarnings = timingWarnings
		}
	}

	return response, nil
}

func (h *Handler) getSupplements(ctx context.Context, ids []string) (map[string]models.Supplement, error) {
	query := `
		SELECT id, name, form, elemental_weight, default_unit
		FROM supplement
		WHERE id = ANY($1)
	`

	rows, err := h.pool.Query(ctx, query, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	supplements := make(map[string]models.Supplement)
	for rows.Next() {
		var s models.Supplement
		if err := rows.Scan(&s.ID, &s.Name, &s.Form, &s.ElementalWeight, &s.DefaultUnit); err != nil {
			return nil, err
		}
		supplements[s.ID] = s
	}

	return supplements, rows.Err()
}

func (h *Handler) getInteractions(ctx context.Context, supplementIDs []string) ([]models.Interaction, error) {
	query := `
		SELECT id, source_id, target_id, type, mechanism, severity
		FROM interaction
		WHERE source_id = ANY($1) AND target_id = ANY($1)
	`

	rows, err := h.pool.Query(ctx, query, supplementIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var interactions []models.Interaction
	for rows.Next() {
		var i models.Interaction
		if err := rows.Scan(&i.ID, &i.SourceID, &i.TargetID, &i.Type, &i.Mechanism, &i.Severity); err != nil {
			return nil, err
		}
		interactions = append(interactions, i)
	}

	return interactions, rows.Err()
}

func (h *Handler) checkTimingWarnings(ctx context.Context, userID string, supplementIDs []string) ([]models.TimingWarning, error) {
	// Get timing rules for the supplements
	rulesQuery := `
		SELECT tr.id, tr.source_supplement_id, tr.target_supplement_id, 
		       tr.min_hours_apart, tr.reason, tr.severity,
		       s1.name as source_name, s1.form as source_form,
		       s2.name as target_name, s2.form as target_form
		FROM timing_rule tr
		JOIN supplement s1 ON tr.source_supplement_id = s1.id
		JOIN supplement s2 ON tr.target_supplement_id = s2.id
		WHERE tr.source_supplement_id = ANY($1) 
		  AND tr.target_supplement_id = ANY($1)
	`

	rows, err := h.pool.Query(ctx, rulesQuery, supplementIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var warnings []models.TimingWarning
	now := time.Now()
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	for rows.Next() {
		var rule struct {
			ID                 string
			SourceSupplementID string
			TargetSupplementID string
			MinHoursApart      float32
			Reason             string
			Severity           models.Severity
			SourceName         string
			SourceForm         *string
			TargetName         string
			TargetForm         *string
		}

		if err := rows.Scan(
			&rule.ID, &rule.SourceSupplementID, &rule.TargetSupplementID,
			&rule.MinHoursApart, &rule.Reason, &rule.Severity,
			&rule.SourceName, &rule.SourceForm,
			&rule.TargetName, &rule.TargetForm,
		); err != nil {
			return nil, err
		}

		// Check today's logs for timing violations
		logsQuery := `
			SELECT supplement_id, logged_at
			FROM log
			WHERE user_id = $1 
			  AND supplement_id IN ($2, $3)
			  AND logged_at >= $4
			ORDER BY logged_at
		`

		logRows, err := h.pool.Query(ctx, logsQuery, userID, rule.SourceSupplementID, rule.TargetSupplementID, dayStart)
		if err != nil {
			continue
		}

		var sourceLogs, targetLogs []time.Time
		for logRows.Next() {
			var supplementID string
			var loggedAt time.Time
			if err := logRows.Scan(&supplementID, &loggedAt); err != nil {
				continue
			}
			if supplementID == rule.SourceSupplementID {
				sourceLogs = append(sourceLogs, loggedAt)
			} else {
				targetLogs = append(targetLogs, loggedAt)
			}
		}
		logRows.Close()

		// Check for timing violations
		for _, sourceTime := range sourceLogs {
			for _, targetTime := range targetLogs {
				hoursApart := float32(abs(targetTime.Sub(sourceTime).Hours()))
				if hoursApart < rule.MinHoursApart {
					warnings = append(warnings, models.TimingWarning{
						ID:               rule.ID,
						Severity:         rule.Severity,
						MinHoursApart:    rule.MinHoursApart,
						ActualHoursApart: hoursApart,
						Reason:           rule.Reason,
						Source: models.SupplementInfo{
							ID:   rule.SourceSupplementID,
							Name: rule.SourceName,
							Form: rule.SourceForm,
						},
						Target: models.SupplementInfo{
							ID:   rule.TargetSupplementID,
							Name: rule.TargetName,
							Form: rule.TargetForm,
						},
					})
				}
			}
		}
	}

	return warnings, nil
}

func (h *Handler) supplementToInfo(s models.Supplement) models.SupplementInfo {
	return models.SupplementInfo{
		ID:   s.ID,
		Name: s.Name,
		Form: s.Form,
	}
}

func (h *Handler) calculateStatus(warnings []models.InteractionWarning) models.TrafficLightStatus {
	if len(warnings) == 0 {
		return models.TrafficLightGreen
	}

	for _, w := range warnings {
		if w.Severity == models.SeverityCritical {
			return models.TrafficLightRed
		}
	}

	for _, w := range warnings {
		if w.Severity == models.SeverityMedium {
			return models.TrafficLightYellow
		}
	}

	return models.TrafficLightGreen
}

func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
