package handlers

import (
	"testing"

	"github.com/nikitalobanov12/stochi/apps/engine/internal/models"
)

func ratioPtr(value float32) *float32 {
	return &value
}

func TestApplyRatioTolerance(t *testing.T) {
	rawRule := models.RatioRule{
		MinRatio: ratioPtr(40),
		MaxRatio: ratioPtr(60),
	}

	tolerantRule := applyRatioTolerance(rawRule, 0.15)

	if tolerantRule.MinRatio == nil || *tolerantRule.MinRatio != 34 {
		t.Fatalf("expected min ratio 34 after tolerance, got %+v", tolerantRule.MinRatio)
	}

	if tolerantRule.MaxRatio == nil || *tolerantRule.MaxRatio != 69 {
		t.Fatalf("expected max ratio 69 after tolerance, got %+v", tolerantRule.MaxRatio)
	}
}

func TestApplyRatioTolerance_MakesNearBoundaryRatiosCompliant(t *testing.T) {
	rawRule := models.RatioRule{
		MinRatio: ratioPtr(40),
	}

	tolerantRule := applyRatioTolerance(rawRule, 0.15)

	isCompliant, _ := CheckRatioCompliance(34, tolerantRule)
	if !isCompliant {
		t.Fatalf("expected ratio 34 to be compliant with min 40 and 15%% tolerance")
	}
}

func TestBuildRatioEvaluationGap(t *testing.T) {
	gap := buildRatioEvaluationGap("source-a", "target-b", "missing_dosage")

	if gap.SourceSupplementID != "source-a" {
		t.Fatalf("expected source supplement id to be source-a, got %s", gap.SourceSupplementID)
	}

	if gap.TargetSupplementID != "target-b" {
		t.Fatalf("expected target supplement id to be target-b, got %s", gap.TargetSupplementID)
	}

	if gap.Reason != "missing_dosage" {
		t.Fatalf("expected reason to be missing_dosage, got %s", gap.Reason)
	}
}
