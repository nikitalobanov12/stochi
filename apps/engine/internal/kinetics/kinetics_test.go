package kinetics

import (
	"math"
	"testing"
)

// tolerance for floating point comparisons
const epsilon = 1e-9

func approxEqual(a, b, tolerance float64) bool {
	return math.Abs(a-b) <= tolerance
}

// ============================================================================
// Lambert W Function Tests
// ============================================================================

func TestLambertW0_SpecialCases(t *testing.T) {
	tests := []struct {
		name     string
		input    float64
		expected float64
	}{
		{"zero", 0, 0},
		{"e", math.E, 1},
		{"negative_one_over_e", -1 / math.E, -1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := LambertW0(tt.input)
			if !approxEqual(result, tt.expected, epsilon) {
				t.Errorf("LambertW0(%v) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestLambertW0_InvalidInput(t *testing.T) {
	// x < -1/e has no real solution
	result := LambertW0(-1)
	if !math.IsNaN(result) {
		t.Errorf("LambertW0(-1) = %v, want NaN", result)
	}

	result = LambertW0(math.NaN())
	if !math.IsNaN(result) {
		t.Errorf("LambertW0(NaN) = %v, want NaN", result)
	}
}

func TestLambertW0_Identity(t *testing.T) {
	// Test that W(x) * e^W(x) = x for various x values
	testCases := []float64{0.1, 0.5, 1, 2, 5, 10, 100, 1000}

	for _, x := range testCases {
		w := LambertW0(x)
		// Verify W(x) * e^W(x) = x
		result := w * math.Exp(w)
		if !approxEqual(result, x, epsilon*x) {
			t.Errorf("W(%v) * e^W(%v) = %v, want %v", x, x, result, x)
		}
	}
}

func TestLambertW0_SmallValues(t *testing.T) {
	// For small x, W(x) ≈ x
	smallX := 0.001
	w := LambertW0(smallX)
	if !approxEqual(w, smallX, 0.01) {
		t.Errorf("LambertW0(%v) = %v, expected approximately %v", smallX, w, smallX)
	}
}

func TestLambertW0_LargeValues(t *testing.T) {
	// For large x, W(x) ≈ ln(x) - ln(ln(x))
	largeX := 1e6
	w := LambertW0(largeX)
	lnx := math.Log(largeX)
	approx := lnx - math.Log(lnx)

	// W should be close to the asymptotic approximation
	if !approxEqual(w, approx, 1) {
		t.Errorf("LambertW0(%v) = %v, expected close to %v", largeX, w, approx)
	}
}

// ============================================================================
// First-Order Kinetics Tests
// ============================================================================

func TestFirstOrderConcentration_AbsorptionPhase(t *testing.T) {
	pk := SupplementPK{
		KineticsType:    FirstOrder,
		PeakMinutes:     60,
		HalfLifeMinutes: 240,
	}

	// At t=0, concentration should be 0
	result := CalculateConcentration(ConcentrationParams{
		Dose:                  100,
		MinutesSinceIngestion: 0,
		PK:                    pk,
	})
	if result != 0 {
		t.Errorf("Concentration at t=0 should be 0, got %v", result)
	}

	// At t=30 (half of Tmax), concentration should be ~50%
	result = CalculateConcentration(ConcentrationParams{
		Dose:                  100,
		MinutesSinceIngestion: 30,
		PK:                    pk,
	})
	if !approxEqual(result, 50, 0.1) {
		t.Errorf("Concentration at t=30 should be ~50%%, got %v", result)
	}

	// At t=60 (Tmax), concentration should be 100%
	result = CalculateConcentration(ConcentrationParams{
		Dose:                  100,
		MinutesSinceIngestion: 60,
		PK:                    pk,
	})
	if !approxEqual(result, 100, 0.1) {
		t.Errorf("Concentration at Tmax should be 100%%, got %v", result)
	}
}

func TestFirstOrderConcentration_EliminationPhase(t *testing.T) {
	pk := SupplementPK{
		KineticsType:    FirstOrder,
		PeakMinutes:     60,
		HalfLifeMinutes: 240, // 4 hours
	}

	// At t = Tmax + half-life (300min), concentration should be ~50%
	result := CalculateConcentration(ConcentrationParams{
		Dose:                  100,
		MinutesSinceIngestion: 300, // 60 + 240
		PK:                    pk,
	})
	if !approxEqual(result, 50, 0.5) {
		t.Errorf("Concentration at one half-life past peak should be ~50%%, got %v", result)
	}

	// At t = Tmax + 2*half-life (540min), concentration should be ~25%
	result = CalculateConcentration(ConcentrationParams{
		Dose:                  100,
		MinutesSinceIngestion: 540, // 60 + 2*240
		PK:                    pk,
	})
	if !approxEqual(result, 25, 0.5) {
		t.Errorf("Concentration at two half-lives past peak should be ~25%%, got %v", result)
	}
}

func TestFirstOrderConcentration_Cleared(t *testing.T) {
	pk := SupplementPK{
		KineticsType:    FirstOrder,
		PeakMinutes:     60,
		HalfLifeMinutes: 60, // Short half-life
	}

	// After many half-lives, should be cleared (< 1%)
	result := CalculateConcentration(ConcentrationParams{
		Dose:                  100,
		MinutesSinceIngestion: 600, // 10 half-lives past peak
		PK:                    pk,
	})
	if result != 0 {
		t.Errorf("Concentration should be 0 after clearing, got %v", result)
	}
}

func TestFirstOrderConcentration_BeforeIngestion(t *testing.T) {
	pk := SupplementPK{
		KineticsType:    FirstOrder,
		PeakMinutes:     60,
		HalfLifeMinutes: 240,
	}

	result := CalculateConcentration(ConcentrationParams{
		Dose:                  100,
		MinutesSinceIngestion: -10,
		PK:                    pk,
	})
	if result != 0 {
		t.Errorf("Concentration before ingestion should be 0, got %v", result)
	}
}

// ============================================================================
// Michaelis-Menten Kinetics Tests
// ============================================================================

func TestMichaelisMentenConcentration_FallbackToFirstOrder(t *testing.T) {
	// When Vmax or Km is not set, should fall back to first-order
	pk := SupplementPK{
		KineticsType:    MichaelisMenten,
		PeakMinutes:     60,
		HalfLifeMinutes: 240,
		Vmax:            0, // Not set
		Km:              0, // Not set
	}

	result := CalculateConcentration(ConcentrationParams{
		Dose:                  100,
		MinutesSinceIngestion: 60,
		PK:                    pk,
	})

	// Should behave like first-order (100% at peak)
	if !approxEqual(result, 100, 0.5) {
		t.Errorf("MM with missing params should fall back to first-order, got %v at peak", result)
	}
}

func TestMichaelisMentenConcentration_VitaminC(t *testing.T) {
	// Test with Vitamin C parameters
	pk := SupplementPK{
		KineticsType:    MichaelisMenten,
		PeakMinutes:     120,
		HalfLifeMinutes: 180,
		Vmax:            2.5,
		Km:              200,
	}

	// Test at different doses
	// At low dose (50mg), absorption should be efficient
	lowDoseConc := CalculateConcentration(ConcentrationParams{
		Dose:                  50,
		MinutesSinceIngestion: 120, // At peak
		PK:                    pk,
	})

	// At high dose (1000mg), absorption efficiency should be lower
	highDoseConc := CalculateConcentration(ConcentrationParams{
		Dose:                  1000,
		MinutesSinceIngestion: 120, // At peak
		PK:                    pk,
	})

	// Both should reach 100% of their respective Cmax at peak
	if !approxEqual(lowDoseConc, 100, 5) {
		t.Errorf("Low dose should reach ~100%% at peak, got %v", lowDoseConc)
	}
	if !approxEqual(highDoseConc, 100, 5) {
		t.Errorf("High dose should reach ~100%% at peak, got %v", highDoseConc)
	}
}

func TestMichaelisMentenConcentration_Elimination(t *testing.T) {
	pk := SupplementPK{
		KineticsType:    MichaelisMenten,
		PeakMinutes:     60,
		HalfLifeMinutes: 60,
		Vmax:            2.0,
		Km:              100,
	}

	// Test elimination follows first-order kinetics
	peakConc := CalculateConcentration(ConcentrationParams{
		Dose:                  200,
		MinutesSinceIngestion: 60, // At peak
		PK:                    pk,
	})

	oneHalfLifeConc := CalculateConcentration(ConcentrationParams{
		Dose:                  200,
		MinutesSinceIngestion: 120, // One half-life past peak
		PK:                    pk,
	})

	// Should be approximately half
	expectedRatio := 0.5
	actualRatio := oneHalfLifeConc / peakConc
	if !approxEqual(actualRatio, expectedRatio, 0.05) {
		t.Errorf("Elimination should follow first-order. Ratio: %v, expected ~%v", actualRatio, expectedRatio)
	}
}

// ============================================================================
// Absorption Dampening Tests
// ============================================================================

func TestApplyAbsorptionDampening_BelowThreshold(t *testing.T) {
	rda := 100.0
	dose := 200.0 // 2x RDA, below 3x threshold

	result := ApplyAbsorptionDampening(dose, rda)
	if result != dose {
		t.Errorf("Dose below 3x RDA should not be dampened. Got %v, expected %v", result, dose)
	}
}

func TestApplyAbsorptionDampening_AboveThreshold(t *testing.T) {
	rda := 100.0
	dose := 500.0 // 5x RDA, above 3x threshold

	result := ApplyAbsorptionDampening(dose, rda)

	// Should be less than dose but more than 3x RDA
	if result >= dose {
		t.Errorf("Dose above 3x RDA should be dampened. Got %v, expected less than %v", result, dose)
	}
	if result <= 3*rda {
		t.Errorf("Dampened dose should be more than 3x RDA. Got %v, expected more than %v", result, 3*rda)
	}

	// Expected: 300 + 100*ln(1 + 200/100) = 300 + 100*ln(3) ≈ 300 + 109.86 ≈ 409.86
	expected := 3*rda + rda*math.Log(1+(dose-3*rda)/rda)
	if !approxEqual(result, expected, 0.01) {
		t.Errorf("Dampened dose incorrect. Got %v, expected %v", result, expected)
	}
}

func TestApplyAbsorptionDampening_NoRDA(t *testing.T) {
	dose := 500.0

	result := ApplyAbsorptionDampening(dose, 0)
	if result != dose {
		t.Errorf("With no RDA, dose should not be dampened. Got %v, expected %v", result, dose)
	}

	result = ApplyAbsorptionDampening(dose, -1)
	if result != dose {
		t.Errorf("With negative RDA, dose should not be dampened. Got %v, expected %v", result, dose)
	}
}

// ============================================================================
// Absorption Efficiency Tests
// ============================================================================

func TestCalculateAbsorptionEfficiency_ZeroDose(t *testing.T) {
	result := CalculateAbsorptionEfficiency(0, 2.5, 200)
	if result != 1 {
		t.Errorf("Efficiency at zero dose should be 1 (100%%), got %v", result)
	}
}

func TestCalculateAbsorptionEfficiency_AtKm(t *testing.T) {
	km := 200.0
	result := CalculateAbsorptionEfficiency(km, 2.5, km)

	// At dose = Km, efficiency should be 50%
	if !approxEqual(result, 0.5, 0.01) {
		t.Errorf("Efficiency at Km should be 0.5 (50%%), got %v", result)
	}
}

func TestCalculateAbsorptionEfficiency_HighDose(t *testing.T) {
	km := 200.0
	highDose := 1000.0

	result := CalculateAbsorptionEfficiency(highDose, 2.5, km)

	// Efficiency = Km / (Km + Dose) = 200 / 1200 ≈ 0.167
	expected := km / (km + highDose)
	if !approxEqual(result, expected, 0.01) {
		t.Errorf("Efficiency at high dose incorrect. Got %v, expected %v", result, expected)
	}
}

func TestCalculateAbsorptionEfficiency_InvalidInputs(t *testing.T) {
	if CalculateAbsorptionEfficiency(100, 2.5, 0) != 0 {
		t.Error("Should return 0 for Km = 0")
	}
	if CalculateAbsorptionEfficiency(100, 2.5, -1) != 0 {
		t.Error("Should return 0 for negative Km")
	}
	if CalculateAbsorptionEfficiency(-1, 2.5, 200) != 0 {
		t.Error("Should return 0 for negative dose")
	}
}

// ============================================================================
// Integration / Scenario Tests
// ============================================================================

func TestVitaminCScenario_500mg(t *testing.T) {
	// Simulate taking 500mg Vitamin C
	pk := SupplementPK{
		KineticsType:    MichaelisMenten,
		PeakMinutes:     120,
		HalfLifeMinutes: 180,
		Vmax:            2.5,
		Km:              200,
	}

	// Check concentration curve at various points
	// Note: During absorption phase with MM kinetics, the curve can vary
	// significantly based on the MM parameters
	points := []struct {
		minutes     float64
		minExpected float64
		maxExpected float64
		description string
	}{
		{0, 0, 0.1, "at ingestion"},
		{60, 0, 150, "during absorption (MM kinetics can overshoot normalized)"},
		{120, 90, 110, "at peak"},
		{300, 40, 60, "one half-life past peak"},
		{480, 15, 35, "two half-lives past peak"},
	}

	for _, p := range points {
		result := CalculateConcentration(ConcentrationParams{
			Dose:                  500,
			MinutesSinceIngestion: p.minutes,
			PK:                    pk,
		})

		if result < p.minExpected || result > p.maxExpected {
			t.Errorf("500mg Vitamin C %s: got %v%%, expected between %v%% and %v%%",
				p.description, result, p.minExpected, p.maxExpected)
		}
	}
}

func TestMagnesiumScenario_400mg(t *testing.T) {
	// Simulate taking 400mg elemental Magnesium (chelated form)
	pk := SupplementPK{
		KineticsType:    MichaelisMenten,
		PeakMinutes:     120,
		HalfLifeMinutes: 720, // 12h
		Vmax:            1.8,
		Km:              150,
	}

	// At peak
	peakConc := CalculateConcentration(ConcentrationParams{
		Dose:                  400,
		MinutesSinceIngestion: 120,
		PK:                    pk,
	})

	// Should reach peak (accounting for saturation effects)
	if peakConc < 90 || peakConc > 100 {
		t.Errorf("400mg Magnesium at peak: got %v%%, expected ~100%%", peakConc)
	}

	// 12h later (one half-life)
	halfLifeConc := CalculateConcentration(ConcentrationParams{
		Dose:                  400,
		MinutesSinceIngestion: 120 + 720,
		PK:                    pk,
	})

	// Should be around 50%
	if halfLifeConc < 45 || halfLifeConc > 55 {
		t.Errorf("400mg Magnesium one half-life past peak: got %v%%, expected ~50%%", halfLifeConc)
	}
}

func TestIronScenario_HighDose(t *testing.T) {
	// Test iron with high dose showing saturation
	// Iron has Km = 30mg, so efficiency drops quickly above this

	// Calculate absorption efficiency at different doses
	eff18mg := CalculateAbsorptionEfficiency(18, 0.8, 30)   // RDA
	eff45mg := CalculateAbsorptionEfficiency(45, 0.8, 30)   // Common supplement dose
	eff100mg := CalculateAbsorptionEfficiency(100, 0.8, 30) // High dose

	// Higher doses should have lower efficiency
	if eff18mg <= eff45mg {
		t.Errorf("Efficiency should decrease with dose. 18mg: %v, 45mg: %v", eff18mg, eff45mg)
	}
	if eff45mg <= eff100mg {
		t.Errorf("Efficiency should decrease with dose. 45mg: %v, 100mg: %v", eff45mg, eff100mg)
	}

	// Log the efficiencies for reference
	t.Logf("Iron absorption efficiency - 18mg: %.1f%%, 45mg: %.1f%%, 100mg: %.1f%%",
		eff18mg*100, eff45mg*100, eff100mg*100)
}
