package handlers

import (
	"fmt"
	"math"

	"github.com/nikitalobanov12/stochi/apps/engine/internal/models"
)

// UnitConversion provides functions for converting between dosage units
// and calculating elemental amounts from compound dosages.

// ToMicrograms converts any dosage unit to micrograms (mcg) as the base unit.
// This allows consistent comparison across all supplement forms.
//
// Conversion factors:
//   - 1 g = 1,000,000 mcg
//   - 1 mg = 1,000 mcg
//   - 1 mcg = 1 mcg (base)
//   - 1 IU varies by vitamin (handled separately)
func ToMicrograms(amount float32, unit models.DosageUnit) (float32, error) {
	switch unit {
	case models.DosageUnitG:
		return amount * 1_000_000, nil
	case models.DosageUnitMg:
		return amount * 1_000, nil
	case models.DosageUnitMcg:
		return amount, nil
	case models.DosageUnitIU:
		// IU cannot be converted without knowing the specific vitamin
		// This should be handled by ToMicrogramsWithContext
		return 0, fmt.Errorf("IU requires vitamin context for conversion")
	case models.DosageUnitMl:
		return 0, fmt.Errorf("ml cannot be converted to mcg without density")
	default:
		return 0, fmt.Errorf("unknown unit: %s", unit)
	}
}

// ToMilligrams converts any dosage unit to milligrams.
func ToMilligrams(amount float32, unit models.DosageUnit) (float32, error) {
	mcg, err := ToMicrograms(amount, unit)
	if err != nil {
		return 0, err
	}
	return mcg / 1_000, nil
}

// IUConversionFactor represents the mcg per IU for fat-soluble vitamins.
// These are standardized conversion factors.
type IUConversionFactor struct {
	VitaminD3 float32 // 1 IU = 0.025 mcg cholecalciferol
	VitaminA  float32 // 1 IU = 0.3 mcg retinol
	VitaminE  float32 // 1 IU = 0.67 mg d-alpha-tocopherol (natural)
}

var IUFactors = IUConversionFactor{
	VitaminD3: 0.025, // 40 IU = 1 mcg
	VitaminA:  0.3,   // 3.33 IU = 1 mcg retinol
	VitaminE:  670,   // 1 IU = 0.67 mg = 670 mcg (natural form)
}

// VitaminIUToMicrograms converts IU to mcg for specific vitamins.
// vitaminType should be one of: "D3", "A", "E"
func VitaminIUToMicrograms(amount float32, vitaminType string) (float32, error) {
	switch vitaminType {
	case "D3", "d3", "vitamin_d3":
		return amount * IUFactors.VitaminD3, nil
	case "A", "a", "vitamin_a":
		return amount * IUFactors.VitaminA, nil
	case "E", "e", "vitamin_e":
		return amount * IUFactors.VitaminE, nil
	default:
		return 0, fmt.Errorf("unknown vitamin type for IU conversion: %s", vitaminType)
	}
}

// CalculateElementalAmount calculates the actual elemental mineral/vitamin amount
// from a compound dosage using the elemental weight percentage.
//
// Example: 30mg Zinc Picolinate with 21% elemental weight
//
//	= 30 * 0.21 = 6.3mg elemental zinc
//
// Parameters:
//   - compoundDosageMg: The total compound dosage in mg
//   - elementalWeightPercent: The percentage of elemental content (e.g., 21.0 for 21%)
//
// Returns the elemental amount in mg.
func CalculateElementalAmount(compoundDosageMg float32, elementalWeightPercent float32) float32 {
	if elementalWeightPercent <= 0 || elementalWeightPercent > 100 {
		// Invalid percentage, return 0 or the original amount for 100%
		if elementalWeightPercent == 100 {
			return compoundDosageMg
		}
		return 0
	}
	return compoundDosageMg * (elementalWeightPercent / 100)
}

// NormalizeDosage converts a dosage to mg and then calculates the elemental amount.
// This is the main function for stoichiometric calculations.
//
// Parameters:
//   - amount: The raw dosage amount
//   - unit: The unit of the dosage
//   - elementalWeightPercent: The elemental weight percentage from the supplement record
//   - vitaminType: Optional, required only for IU conversions (e.g., "D3")
//
// Returns the elemental amount in mg.
func NormalizeDosage(amount float32, unit models.DosageUnit, elementalWeightPercent float32, vitaminType string) (float32, error) {
	var amountMg float32

	switch unit {
	case models.DosageUnitIU:
		if vitaminType == "" {
			return 0, fmt.Errorf("vitamin type required for IU conversion")
		}
		mcg, err := VitaminIUToMicrograms(amount, vitaminType)
		if err != nil {
			return 0, err
		}
		amountMg = mcg / 1_000
	default:
		mg, err := ToMilligrams(amount, unit)
		if err != nil {
			return 0, err
		}
		amountMg = mg
	}

	return CalculateElementalAmount(amountMg, elementalWeightPercent), nil
}

// DosageInput represents a single supplement dosage for ratio calculations.
type DosageInput struct {
	SupplementID           string            `json:"supplementId"`
	Amount                 float32           `json:"amount"`
	Unit                   models.DosageUnit `json:"unit"`
	ElementalWeightPercent float32           `json:"elementalWeightPercent"`
	VitaminType            string            `json:"vitaminType,omitempty"` // For IU conversions
}

// CalculateRatio computes the elemental ratio between two supplements.
// Returns sourceElemental / targetElemental.
//
// Example: Zn:Cu ratio
//   - 30mg Zinc Picolinate (21% elemental) = 6.3mg Zn
//   - 2mg Copper Bisglycinate (30% elemental) = 0.6mg Cu
//   - Ratio = 6.3 / 0.6 = 10.5:1
func CalculateRatio(source, target DosageInput) (float32, error) {
	sourceElemental, err := NormalizeDosage(source.Amount, source.Unit, source.ElementalWeightPercent, source.VitaminType)
	if err != nil {
		return 0, fmt.Errorf("failed to normalize source dosage: %w", err)
	}

	targetElemental, err := NormalizeDosage(target.Amount, target.Unit, target.ElementalWeightPercent, target.VitaminType)
	if err != nil {
		return 0, fmt.Errorf("failed to normalize target dosage: %w", err)
	}

	if targetElemental == 0 {
		return 0, fmt.Errorf("target elemental amount is zero, cannot calculate ratio")
	}

	return sourceElemental / targetElemental, nil
}

// CheckRatioCompliance checks if a ratio falls within the acceptable range.
// Returns:
//   - isCompliant: true if within range
//   - deviation: how far from optimal (negative = below min, positive = above max, 0 = within range)
func CheckRatioCompliance(currentRatio float32, rule models.RatioRule) (isCompliant bool, deviation float32) {
	minRatio := float32(0)
	maxRatio := float32(math.MaxFloat32)

	if rule.MinRatio != nil {
		minRatio = *rule.MinRatio
	}
	if rule.MaxRatio != nil {
		maxRatio = *rule.MaxRatio
	}

	if currentRatio < minRatio {
		return false, currentRatio - minRatio // Negative deviation
	}
	if currentRatio > maxRatio {
		return false, currentRatio - maxRatio // Positive deviation
	}

	return true, 0
}

// RoundToDecimal rounds a float to the specified number of decimal places.
func RoundToDecimal(value float32, decimals int) float32 {
	multiplier := math.Pow(10, float64(decimals))
	return float32(math.Round(float64(value)*multiplier) / multiplier)
}
