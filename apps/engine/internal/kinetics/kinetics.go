// Package kinetics provides pharmacokinetic modeling functions for supplement absorption.
//
// This package implements both first-order (exponential decay) and Michaelis-Menten
// (capacity-limited) kinetics for accurate plasma concentration modeling.
package kinetics

import (
	"math"
)

// KineticsType represents the type of pharmacokinetic model to use.
type KineticsType string

const (
	// FirstOrder uses standard exponential decay: C(t) = C0 * e^(-kt)
	FirstOrder KineticsType = "first_order"
	// MichaelisMenten uses capacity-limited kinetics for saturable transporters
	MichaelisMenten KineticsType = "michaelis_menten"
)

// SupplementPK contains pharmacokinetic parameters for a supplement.
type SupplementPK struct {
	// Common parameters
	KineticsType    KineticsType
	PeakMinutes     float64 // Time to Cmax (Tmax)
	HalfLifeMinutes float64 // Elimination half-life (t½)

	// First-order specific
	BioavailabilityPercent float64 // F - fraction absorbed (0-100)

	// Michaelis-Menten specific
	Vmax                     float64 // Maximum velocity (mg/min)
	Km                       float64 // Michaelis constant (mg)
	AbsorptionSaturationDose float64 // Dose above which absorption saturates
	RDAAmount                float64 // RDA for heuristic dampening
}

// ConcentrationParams contains parameters for concentration calculation.
type ConcentrationParams struct {
	Dose                  float64      // Administered dose (mg)
	MinutesSinceIngestion float64      // Time since intake (minutes)
	PK                    SupplementPK // Pharmacokinetic parameters
}

// CalculateConcentration returns the estimated plasma concentration as a percentage of Cmax (0-100).
// It dispatches to the appropriate kinetic model based on SupplementPK.KineticsType.
func CalculateConcentration(params ConcentrationParams) float64 {
	if params.MinutesSinceIngestion < 0 {
		return 0
	}

	switch params.PK.KineticsType {
	case MichaelisMenten:
		return calculateMichaelisMentenConcentration(params)
	default:
		return calculateFirstOrderConcentration(params)
	}
}

// calculateFirstOrderConcentration uses standard exponential decay kinetics.
//
// For t < Tmax (absorption phase): C(t) = Cmax * (t / Tmax)
// For t >= Tmax (elimination phase): C(t) = Cmax * e^(-k * (t - Tmax))
// where k = ln(2) / t½
func calculateFirstOrderConcentration(params ConcentrationParams) float64 {
	t := params.MinutesSinceIngestion
	tmax := params.PK.PeakMinutes
	halfLife := params.PK.HalfLifeMinutes

	// Use defaults if not specified
	if tmax <= 0 {
		tmax = 60 // Default 1 hour
	}
	if halfLife <= 0 {
		halfLife = 240 // Default 4 hours
	}

	// Absorption phase (linear ramp to peak)
	if t < tmax {
		return (t / tmax) * 100
	}

	// At peak
	if t == tmax {
		return 100
	}

	// Elimination phase (exponential decay)
	k := math.Log(2) / halfLife
	timeSincePeak := t - tmax
	concentration := 100 * math.Exp(-k*timeSincePeak)

	// Consider cleared when below 1%
	if concentration < 1 {
		return 0
	}
	return concentration
}

// calculateMichaelisMentenConcentration uses capacity-limited kinetics.
//
// For supplements with saturable transporters (Vitamin C, Magnesium, Iron),
// absorption follows Michaelis-Menten kinetics:
//
//	dA/dt = -(Vmax * A) / (Km + A)
//
// The analytical solution uses the Lambert W function:
//
//	A(t) = Km * W((A0/Km) * e^((A0 - Vmax*t)/Km))
//
// This avoids expensive numerical integration while maintaining accuracy.
func calculateMichaelisMentenConcentration(params ConcentrationParams) float64 {
	t := params.MinutesSinceIngestion
	dose := params.Dose
	vmax := params.PK.Vmax
	km := params.PK.Km
	tmax := params.PK.PeakMinutes
	halfLife := params.PK.HalfLifeMinutes

	// Validate MM parameters
	if vmax <= 0 || km <= 0 {
		// Fall back to first-order if MM params not set
		return calculateFirstOrderConcentration(params)
	}

	// Use defaults for peak/halflife if not specified
	if tmax <= 0 {
		tmax = 60
	}
	if halfLife <= 0 {
		halfLife = 240
	}

	// Calculate effective absorbed amount using MM absorption
	// At saturation, absorption efficiency drops significantly
	effectiveDose := calculateMMAbsorbedAmount(dose, vmax, km, t)

	// Normalize to percentage of theoretical max concentration
	// Account for saturation: higher doses don't linearly increase Cmax
	maxConcentration := calculateMMAbsorbedAmount(dose, vmax, km, tmax)
	if maxConcentration <= 0 {
		return 0
	}

	// During absorption phase
	if t < tmax {
		// Non-linear absorption ramp
		return (effectiveDose / maxConcentration) * 100
	}

	// At and after peak - use first-order elimination from the achieved Cmax
	// (Most supplements follow first-order elimination even with MM absorption)
	k := math.Log(2) / halfLife
	timeSincePeak := t - tmax
	concentration := 100 * math.Exp(-k*timeSincePeak)

	if concentration < 1 {
		return 0
	}
	return concentration
}

// calculateMMAbsorbedAmount calculates the amount absorbed using Michaelis-Menten kinetics.
// Uses the Lambert W function for analytical solution:
//
//	A(t) = Km * W((A0/Km) * e^((A0 - Vmax*t)/Km))
func calculateMMAbsorbedAmount(initialDose, vmax, km, minutes float64) float64 {
	if initialDose <= 0 || minutes <= 0 {
		return 0
	}

	// Calculate the argument for Lambert W
	// x = (A0/Km) * e^((A0 - Vmax*t)/Km)
	a0OverKm := initialDose / km
	exponent := (initialDose - vmax*minutes) / km
	x := a0OverKm * math.Exp(exponent)

	// Handle edge cases
	if x < 0 {
		return 0 // All absorbed/cleared
	}
	if math.IsInf(x, 1) {
		return initialDose // Very early in absorption
	}

	// Calculate W(x) and return Km * W(x)
	w := LambertW0(x)
	result := km * w

	// Can't absorb more than we started with
	if result > initialDose {
		return initialDose
	}
	if result < 0 {
		return 0
	}

	return result
}

// LambertW0 computes the principal branch (W₀) of the Lambert W function.
//
// The Lambert W function is defined as the inverse of f(W) = W * e^W,
// i.e., it satisfies: W(x) * e^W(x) = x
//
// This implementation uses Halley's method for cubic convergence:
//
//	W_{n+1} = W_n - (W_n*e^W_n - x) / (e^W_n*(W_n+1) - (W_n+2)*(W_n*e^W_n - x)/(2*W_n+2))
//
// Convergence is typically achieved in 3-5 iterations for most inputs.
func LambertW0(x float64) float64 {
	// Handle special cases
	if math.IsNaN(x) {
		return math.NaN()
	}
	if x == 0 {
		return 0
	}
	if x == math.E {
		return 1
	}
	if x < -1/math.E {
		return math.NaN() // No real solution for x < -1/e
	}
	if x == -1/math.E {
		return -1
	}

	// Initial guess
	var w float64
	if x < 1 {
		// For small x, use linear approximation
		w = x
	} else if x < 10 {
		// For moderate x
		w = math.Log(x)
	} else {
		// For large x, use asymptotic expansion
		lnx := math.Log(x)
		lnlnx := math.Log(lnx)
		w = lnx - lnlnx + lnlnx/lnx
	}

	// Halley's method iteration
	const maxIterations = 50
	const tolerance = 1e-12

	for i := 0; i < maxIterations; i++ {
		ew := math.Exp(w)
		wew := w * ew

		// f = W*e^W - x
		f := wew - x

		// Check convergence
		if math.Abs(f) < tolerance*math.Abs(x) {
			break
		}

		// f' = e^W * (W + 1)
		fp := ew * (w + 1)

		// Halley's method correction
		// f'' = e^W * (W + 2)
		fpp := ew * (w + 2)

		// Halley's update: w -= f / (f' - f*f''/(2*f'))
		// Simplified: w -= 2*f*f' / (2*f'*f' - f*f'')
		denom := 2*fp*fp - f*fpp
		if denom == 0 {
			// Fall back to Newton's method
			w -= f / fp
		} else {
			w -= 2 * f * fp / denom
		}
	}

	return w
}

// ApplyAbsorptionDampening applies a logarithmic dampening factor for high-dose supplements
// that don't have full MM parameters but are known to have saturable absorption.
//
// For doses > 3x RDA, applies: effectiveDose = 3*RDA + RDA*ln(1 + excess/RDA)
// This provides a smooth transition from linear to logarithmic absorption.
func ApplyAbsorptionDampening(dose, rda float64) float64 {
	if rda <= 0 {
		return dose // No RDA defined, return unchanged
	}

	threshold := 3 * rda
	if dose <= threshold {
		return dose // Linear absorption below threshold
	}

	// Logarithmic dampening above threshold
	excess := dose - threshold
	dampenedExcess := rda * math.Log(1+excess/rda)
	return threshold + dampenedExcess
}

// CalculateAbsorptionEfficiency returns the absorption efficiency (0-1) for a given dose
// using Michaelis-Menten kinetics.
//
// Efficiency = Vmax / (Km + Dose)
//
// This shows how absorption rate decreases as dose increases beyond Km.
func CalculateAbsorptionEfficiency(dose, vmax, km float64) float64 {
	if km <= 0 || dose < 0 {
		return 0
	}
	if dose == 0 {
		return 1 // 100% efficiency at zero dose
	}

	// MM efficiency formula normalized to max efficiency at low dose
	efficiency := km / (km + dose)
	return efficiency
}
