package handlers

import (
	"testing"
	"time"

	"github.com/nikitalobanov12/stochi/apps/engine/internal/models"
)

func TestBuildTimingWarningsFromRuleLogs(t *testing.T) {
	rules := []timingRuleRecord{
		{
			ID:                 "rule-1",
			SourceSupplementID: "supp-a",
			TargetSupplementID: "supp-b",
			MinHoursApart:      4,
			Reason:             "needs separation",
			Severity:           models.SeverityMedium,
			SourceName:         "Tyrosine",
			TargetName:         "5-HTP",
		},
	}

	logsBySupplementID := map[string][]time.Time{
		"supp-a": {time.Date(2026, 2, 28, 9, 0, 0, 0, time.UTC)},
		"supp-b": {time.Date(2026, 2, 28, 11, 0, 0, 0, time.UTC)},
	}

	warnings := buildTimingWarningsFromRuleLogs(rules, logsBySupplementID)

	if len(warnings) != 1 {
		t.Fatalf("expected 1 warning, got %d", len(warnings))
	}

	if warnings[0].ID != "rule-1" {
		t.Fatalf("expected warning id rule-1, got %s", warnings[0].ID)
	}

	if warnings[0].ActualHoursApart != 2 {
		t.Fatalf("expected 2 hours apart, got %v", warnings[0].ActualHoursApart)
	}
}

func TestBuildTimingWarningsFromRuleLogs_NoViolation(t *testing.T) {
	rules := []timingRuleRecord{
		{
			ID:                 "rule-1",
			SourceSupplementID: "supp-a",
			TargetSupplementID: "supp-b",
			MinHoursApart:      4,
			Reason:             "needs separation",
			Severity:           models.SeverityMedium,
			SourceName:         "Tyrosine",
			TargetName:         "5-HTP",
		},
	}

	logsBySupplementID := map[string][]time.Time{
		"supp-a": {time.Date(2026, 2, 28, 9, 0, 0, 0, time.UTC)},
		"supp-b": {time.Date(2026, 2, 28, 14, 30, 0, 0, time.UTC)},
	}

	warnings := buildTimingWarningsFromRuleLogs(rules, logsBySupplementID)

	if len(warnings) != 0 {
		t.Fatalf("expected no warnings, got %d", len(warnings))
	}
}
