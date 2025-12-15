package models

import (
	"time"
)

// InteractionType represents the type of interaction between supplements
type InteractionType string

const (
	InteractionTypeInhibition  InteractionType = "inhibition"
	InteractionTypeSynergy     InteractionType = "synergy"
	InteractionTypeCompetition InteractionType = "competition"
)

// Severity represents the severity level of an interaction
type Severity string

const (
	SeverityLow      Severity = "low"
	SeverityMedium   Severity = "medium"
	SeverityCritical Severity = "critical"
)

// DosageUnit represents the unit of measurement for supplement dosages
type DosageUnit string

const (
	DosageUnitMg  DosageUnit = "mg"
	DosageUnitMcg DosageUnit = "mcg"
	DosageUnitG   DosageUnit = "g"
	DosageUnitIU  DosageUnit = "IU"
	DosageUnitMl  DosageUnit = "ml"
)

// Supplement represents a supplement in the database
type Supplement struct {
	ID              string     `json:"id"`
	Name            string     `json:"name"`
	Form            *string    `json:"form,omitempty"`
	ElementalWeight *float32   `json:"elementalWeight,omitempty"`
	DefaultUnit     DosageUnit `json:"defaultUnit"`
}

// Interaction represents an interaction between two supplements
type Interaction struct {
	ID        string          `json:"id"`
	SourceID  string          `json:"sourceId"`
	TargetID  string          `json:"targetId"`
	Type      InteractionType `json:"type"`
	Mechanism *string         `json:"mechanism,omitempty"`
	Severity  Severity        `json:"severity"`
}

// TimingRule represents a timing rule between two supplements
type TimingRule struct {
	ID                 string   `json:"id"`
	SourceSupplementID string   `json:"sourceSupplementId"`
	TargetSupplementID string   `json:"targetSupplementId"`
	MinHoursApart      float32  `json:"minHoursApart"`
	Reason             string   `json:"reason"`
	Severity           Severity `json:"severity"`
}

// RatioRule represents a ratio rule between two supplements
type RatioRule struct {
	ID                 string   `json:"id"`
	SourceSupplementID string   `json:"sourceSupplementId"`
	TargetSupplementID string   `json:"targetSupplementId"`
	MinRatio           *float32 `json:"minRatio,omitempty"`
	MaxRatio           *float32 `json:"maxRatio,omitempty"`
	OptimalRatio       *float32 `json:"optimalRatio,omitempty"`
	WarningMessage     string   `json:"warningMessage"`
	Severity           Severity `json:"severity"`
}

// LogEntry represents a supplement log entry
type LogEntry struct {
	ID           string     `json:"id"`
	UserID       string     `json:"userId"`
	SupplementID string     `json:"supplementId"`
	Dosage       float32    `json:"dosage"`
	Unit         DosageUnit `json:"unit"`
	LoggedAt     time.Time  `json:"loggedAt"`
}

// AnalyzeRequest is the request body for the analyze endpoint
type AnalyzeRequest struct {
	SupplementIDs []string `json:"supplementIds"`
	// Optional: include logs for timing analysis
	IncludeTiming bool `json:"includeTiming,omitempty"`
}

// AnalyzeResponse is the response from the analyze endpoint
type AnalyzeResponse struct {
	Status         TrafficLightStatus   `json:"status"`
	Warnings       []InteractionWarning `json:"warnings"`
	Synergies      []InteractionWarning `json:"synergies"`
	TimingWarnings []TimingWarning      `json:"timingWarnings,omitempty"`
	RatioWarnings  []RatioWarning       `json:"ratioWarnings,omitempty"`
}

// TrafficLightStatus represents the overall safety status
type TrafficLightStatus string

const (
	TrafficLightGreen  TrafficLightStatus = "green"
	TrafficLightYellow TrafficLightStatus = "yellow"
	TrafficLightRed    TrafficLightStatus = "red"
)

// InteractionWarning represents a single interaction warning
type InteractionWarning struct {
	ID        string          `json:"id"`
	Type      InteractionType `json:"type"`
	Severity  Severity        `json:"severity"`
	Mechanism *string         `json:"mechanism,omitempty"`
	Source    SupplementInfo  `json:"source"`
	Target    SupplementInfo  `json:"target"`
}

// TimingWarning represents a timing-related warning
type TimingWarning struct {
	ID               string         `json:"id"`
	Severity         Severity       `json:"severity"`
	MinHoursApart    float32        `json:"minHoursApart"`
	ActualHoursApart float32        `json:"actualHoursApart"`
	Reason           string         `json:"reason"`
	Source           SupplementInfo `json:"source"`
	Target           SupplementInfo `json:"target"`
}

// RatioWarning represents a ratio imbalance warning
type RatioWarning struct {
	ID             string         `json:"id"`
	Severity       Severity       `json:"severity"`
	CurrentRatio   float32        `json:"currentRatio"`
	OptimalRatio   *float32       `json:"optimalRatio,omitempty"`
	MinRatio       *float32       `json:"minRatio,omitempty"`
	MaxRatio       *float32       `json:"maxRatio,omitempty"`
	WarningMessage string         `json:"warningMessage"`
	Source         SupplementInfo `json:"source"`
	Target         SupplementInfo `json:"target"`
}

// SupplementInfo contains basic supplement info for responses
type SupplementInfo struct {
	ID   string  `json:"id"`
	Name string  `json:"name"`
	Form *string `json:"form,omitempty"`
}
