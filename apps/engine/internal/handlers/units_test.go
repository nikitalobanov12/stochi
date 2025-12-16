package handlers

import (
	"math"
	"testing"

	"github.com/nikitalobanov12/stochi/apps/engine/internal/models"
)

// Helper to compare floats with tolerance
func almostEqual(a, b, tolerance float32) bool {
	return float32(math.Abs(float64(a-b))) <= tolerance
}

func TestToMicrograms(t *testing.T) {
	tests := []struct {
		name    string
		amount  float32
		unit    models.DosageUnit
		want    float32
		wantErr bool
	}{
		{
			name:    "grams to micrograms",
			amount:  1,
			unit:    models.DosageUnitG,
			want:    1_000_000,
			wantErr: false,
		},
		{
			name:    "milligrams to micrograms",
			amount:  1,
			unit:    models.DosageUnitMg,
			want:    1_000,
			wantErr: false,
		},
		{
			name:    "micrograms unchanged",
			amount:  500,
			unit:    models.DosageUnitMcg,
			want:    500,
			wantErr: false,
		},
		{
			name:    "30mg zinc picolinate",
			amount:  30,
			unit:    models.DosageUnitMg,
			want:    30_000,
			wantErr: false,
		},
		{
			name:    "IU requires context - should error",
			amount:  5000,
			unit:    models.DosageUnitIU,
			want:    0,
			wantErr: true,
		},
		{
			name:    "ml cannot convert - should error",
			amount:  10,
			unit:    models.DosageUnitMl,
			want:    0,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ToMicrograms(tt.amount, tt.unit)
			if (err != nil) != tt.wantErr {
				t.Errorf("ToMicrograms() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !almostEqual(got, tt.want, 0.01) {
				t.Errorf("ToMicrograms() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestToMilligrams(t *testing.T) {
	tests := []struct {
		name    string
		amount  float32
		unit    models.DosageUnit
		want    float32
		wantErr bool
	}{
		{
			name:    "grams to milligrams",
			amount:  2,
			unit:    models.DosageUnitG,
			want:    2_000,
			wantErr: false,
		},
		{
			name:    "milligrams unchanged",
			amount:  30,
			unit:    models.DosageUnitMg,
			want:    30,
			wantErr: false,
		},
		{
			name:    "micrograms to milligrams",
			amount:  5000,
			unit:    models.DosageUnitMcg,
			want:    5,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ToMilligrams(tt.amount, tt.unit)
			if (err != nil) != tt.wantErr {
				t.Errorf("ToMilligrams() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !almostEqual(got, tt.want, 0.01) {
				t.Errorf("ToMilligrams() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestVitaminIUToMicrograms(t *testing.T) {
	tests := []struct {
		name        string
		amount      float32
		vitaminType string
		want        float32
		wantErr     bool
	}{
		{
			name:        "vitamin D3 5000 IU",
			amount:      5000,
			vitaminType: "D3",
			want:        125, // 5000 * 0.025 = 125 mcg
			wantErr:     false,
		},
		{
			name:        "vitamin D3 lowercase",
			amount:      5000,
			vitaminType: "d3",
			want:        125,
			wantErr:     false,
		},
		{
			name:        "vitamin A 10000 IU",
			amount:      10000,
			vitaminType: "A",
			want:        3000, // 10000 * 0.3 = 3000 mcg
			wantErr:     false,
		},
		{
			name:        "vitamin E 400 IU",
			amount:      400,
			vitaminType: "E",
			want:        268000, // 400 * 670 = 268000 mcg (natural form)
			wantErr:     false,
		},
		{
			name:        "unknown vitamin type",
			amount:      100,
			vitaminType: "B12",
			want:        0,
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := VitaminIUToMicrograms(tt.amount, tt.vitaminType)
			if (err != nil) != tt.wantErr {
				t.Errorf("VitaminIUToMicrograms() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !almostEqual(got, tt.want, 1) {
				t.Errorf("VitaminIUToMicrograms() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCalculateElementalAmount(t *testing.T) {
	tests := []struct {
		name                   string
		compoundDosageMg       float32
		elementalWeightPercent float32
		want                   float32
	}{
		{
			name:                   "zinc picolinate 30mg @ 21%",
			compoundDosageMg:       30,
			elementalWeightPercent: 21,
			want:                   6.3, // 30 * 0.21 = 6.3
		},
		{
			name:                   "magnesium glycinate 400mg @ 14.1%",
			compoundDosageMg:       400,
			elementalWeightPercent: 14.1,
			want:                   56.4, // 400 * 0.141 = 56.4
		},
		{
			name:                   "copper bisglycinate 2mg @ 30%",
			compoundDosageMg:       2,
			elementalWeightPercent: 30,
			want:                   0.6, // 2 * 0.30 = 0.6
		},
		{
			name:                   "iron bisglycinate 25mg @ 27.4%",
			compoundDosageMg:       25,
			elementalWeightPercent: 27.4,
			want:                   6.85, // 25 * 0.274 = 6.85
		},
		{
			name:                   "calcium citrate 1000mg @ 24.1%",
			compoundDosageMg:       1000,
			elementalWeightPercent: 24.1,
			want:                   241, // 1000 * 0.241 = 241
		},
		{
			name:                   "100% elemental weight",
			compoundDosageMg:       50,
			elementalWeightPercent: 100,
			want:                   50,
		},
		{
			name:                   "invalid negative percentage",
			compoundDosageMg:       100,
			elementalWeightPercent: -10,
			want:                   0,
		},
		{
			name:                   "zero percentage",
			compoundDosageMg:       100,
			elementalWeightPercent: 0,
			want:                   0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateElementalAmount(tt.compoundDosageMg, tt.elementalWeightPercent)
			if !almostEqual(got, tt.want, 0.01) {
				t.Errorf("CalculateElementalAmount() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNormalizeDosage(t *testing.T) {
	tests := []struct {
		name                   string
		amount                 float32
		unit                   models.DosageUnit
		elementalWeightPercent float32
		vitaminType            string
		want                   float32
		wantErr                bool
	}{
		{
			name:                   "zinc picolinate 30mg",
			amount:                 30,
			unit:                   models.DosageUnitMg,
			elementalWeightPercent: 21,
			vitaminType:            "",
			want:                   6.3, // 30 * 0.21
			wantErr:                false,
		},
		{
			name:                   "magnesium glycinate 2g (2000mg)",
			amount:                 2,
			unit:                   models.DosageUnitG,
			elementalWeightPercent: 14.1,
			vitaminType:            "",
			want:                   282, // 2000 * 0.141
			wantErr:                false,
		},
		{
			name:                   "selenium 200mcg @ 40.3%",
			amount:                 200,
			unit:                   models.DosageUnitMcg,
			elementalWeightPercent: 40.3,
			vitaminType:            "",
			want:                   0.0806, // 0.2mg * 0.403 = 0.0806mg
			wantErr:                false,
		},
		{
			name:                   "vitamin D3 5000 IU",
			amount:                 5000,
			unit:                   models.DosageUnitIU,
			elementalWeightPercent: 100, // Pure vitamin
			vitaminType:            "D3",
			want:                   0.125, // 5000 * 0.025 = 125 mcg = 0.125 mg
			wantErr:                false,
		},
		{
			name:                   "IU without vitamin type - error",
			amount:                 5000,
			unit:                   models.DosageUnitIU,
			elementalWeightPercent: 100,
			vitaminType:            "",
			want:                   0,
			wantErr:                true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := NormalizeDosage(tt.amount, tt.unit, tt.elementalWeightPercent, tt.vitaminType)
			if (err != nil) != tt.wantErr {
				t.Errorf("NormalizeDosage() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !almostEqual(got, tt.want, 0.01) {
				t.Errorf("NormalizeDosage() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCalculateRatio(t *testing.T) {
	tests := []struct {
		name    string
		source  DosageInput
		target  DosageInput
		want    float32
		wantErr bool
	}{
		{
			name: "Zn:Cu ratio (10.5:1)",
			source: DosageInput{
				SupplementID:           "zinc-picolinate",
				Amount:                 30,
				Unit:                   models.DosageUnitMg,
				ElementalWeightPercent: 21, // 6.3mg elemental
				VitaminType:            "",
			},
			target: DosageInput{
				SupplementID:           "copper-bisglycinate",
				Amount:                 2,
				Unit:                   models.DosageUnitMg,
				ElementalWeightPercent: 30, // 0.6mg elemental
				VitaminType:            "",
			},
			want:    10.5, // 6.3 / 0.6 = 10.5
			wantErr: false,
		},
		{
			name: "Ca:Mg ratio (1:1)",
			source: DosageInput{
				SupplementID:           "calcium-citrate",
				Amount:                 400,
				Unit:                   models.DosageUnitMg,
				ElementalWeightPercent: 24.1, // 96.4mg elemental
				VitaminType:            "",
			},
			target: DosageInput{
				SupplementID:           "magnesium-glycinate",
				Amount:                 683,
				Unit:                   models.DosageUnitMg,
				ElementalWeightPercent: 14.1, // ~96.4mg elemental
				VitaminType:            "",
			},
			want:    1.0, // ~96.4 / ~96.3 ≈ 1.0
			wantErr: false,
		},
		{
			name: "D3:K2 ratio (50:1)",
			source: DosageInput{
				SupplementID:           "vitamin-d3",
				Amount:                 5000,
				Unit:                   models.DosageUnitIU,
				ElementalWeightPercent: 100,
				VitaminType:            "D3",
			},
			target: DosageInput{
				SupplementID:           "vitamin-k2",
				Amount:                 100,
				Unit:                   models.DosageUnitMcg,
				ElementalWeightPercent: 100,
				VitaminType:            "",
			},
			// D3: 5000 IU = 125 mcg = 0.125 mg
			// K2: 100 mcg = 0.1 mg
			// Ratio: 0.125 / 0.1 = 1.25
			want:    1.25,
			wantErr: false,
		},
		{
			name: "target zero - error",
			source: DosageInput{
				SupplementID:           "zinc",
				Amount:                 30,
				Unit:                   models.DosageUnitMg,
				ElementalWeightPercent: 21,
				VitaminType:            "",
			},
			target: DosageInput{
				SupplementID:           "copper",
				Amount:                 0, // Zero dosage
				Unit:                   models.DosageUnitMg,
				ElementalWeightPercent: 30,
				VitaminType:            "",
			},
			want:    0,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := CalculateRatio(tt.source, tt.target)
			if (err != nil) != tt.wantErr {
				t.Errorf("CalculateRatio() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !almostEqual(got, tt.want, 0.1) {
				t.Errorf("CalculateRatio() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCheckRatioCompliance(t *testing.T) {
	// Helper to create float32 pointers
	f := func(v float32) *float32 { return &v }

	tests := []struct {
		name           string
		currentRatio   float32
		rule           models.RatioRule
		wantCompliant  bool
		wantDeviation  float32
		deviationCheck func(got, want float32) bool
	}{
		{
			name:         "Zn:Cu within range (8:1, target 10-15:1)",
			currentRatio: 10.5,
			rule: models.RatioRule{
				MinRatio: f(10),
				MaxRatio: f(15),
			},
			wantCompliant: true,
			wantDeviation: 0,
		},
		{
			name:         "Zn:Cu too low (8:1, target 10-15:1)",
			currentRatio: 8,
			rule: models.RatioRule{
				MinRatio: f(10),
				MaxRatio: f(15),
			},
			wantCompliant: false,
			wantDeviation: -2, // 8 - 10 = -2
		},
		{
			name:         "Zn:Cu too high (20:1, target 10-15:1)",
			currentRatio: 20,
			rule: models.RatioRule{
				MinRatio: f(10),
				MaxRatio: f(15),
			},
			wantCompliant: false,
			wantDeviation: 5, // 20 - 15 = 5
		},
		{
			name:         "Ca:Mg within range (1.5:1, target 0.5-2:1)",
			currentRatio: 1.5,
			rule: models.RatioRule{
				MinRatio: f(0.5),
				MaxRatio: f(2),
			},
			wantCompliant: true,
			wantDeviation: 0,
		},
		{
			name:         "only min ratio set - within range",
			currentRatio: 5,
			rule: models.RatioRule{
				MinRatio: f(3),
				MaxRatio: nil,
			},
			wantCompliant: true,
			wantDeviation: 0,
		},
		{
			name:         "only max ratio set - within range",
			currentRatio: 5,
			rule: models.RatioRule{
				MinRatio: nil,
				MaxRatio: f(10),
			},
			wantCompliant: true,
			wantDeviation: 0,
		},
		{
			name:         "no bounds set - always compliant",
			currentRatio: 100,
			rule: models.RatioRule{
				MinRatio: nil,
				MaxRatio: nil,
			},
			wantCompliant: true,
			wantDeviation: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotCompliant, gotDeviation := CheckRatioCompliance(tt.currentRatio, tt.rule)
			if gotCompliant != tt.wantCompliant {
				t.Errorf("CheckRatioCompliance() compliant = %v, want %v", gotCompliant, tt.wantCompliant)
			}
			if !almostEqual(gotDeviation, tt.wantDeviation, 0.01) {
				t.Errorf("CheckRatioCompliance() deviation = %v, want %v", gotDeviation, tt.wantDeviation)
			}
		})
	}
}

func TestRoundToDecimal(t *testing.T) {
	tests := []struct {
		name     string
		value    float32
		decimals int
		want     float32
	}{
		{
			name:     "round to 2 decimals",
			value:    3.14159,
			decimals: 2,
			want:     3.14,
		},
		{
			name:     "round to 1 decimal",
			value:    10.567,
			decimals: 1,
			want:     10.6,
		},
		{
			name:     "round to 0 decimals",
			value:    10.5,
			decimals: 0,
			want:     11, // Standard rounding
		},
		{
			name:     "already at precision",
			value:    1.5,
			decimals: 1,
			want:     1.5,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := RoundToDecimal(tt.value, tt.decimals)
			if !almostEqual(got, tt.want, 0.01) {
				t.Errorf("RoundToDecimal() = %v, want %v", got, tt.want)
			}
		})
	}
}

// Real-world scenario tests
func TestRealWorldScenarios(t *testing.T) {
	t.Run("typical zinc:copper supplementation", func(t *testing.T) {
		// Common stack: 30mg Zinc Picolinate + 2mg Copper Bisglycinate
		zincElemental := CalculateElementalAmount(30, 21)  // 6.3mg
		copperElemental := CalculateElementalAmount(2, 30) // 0.6mg
		ratio := zincElemental / copperElemental           // 10.5:1

		if !almostEqual(ratio, 10.5, 0.1) {
			t.Errorf("Zn:Cu ratio = %v, want ~10.5", ratio)
		}

		// Check compliance with 10-15:1 rule
		rule := models.RatioRule{
			MinRatio: func(v float32) *float32 { return &v }(10),
			MaxRatio: func(v float32) *float32 { return &v }(15),
		}
		compliant, _ := CheckRatioCompliance(ratio, rule)
		if !compliant {
			t.Error("Expected Zn:Cu ratio of 10.5:1 to be compliant with 10-15:1 rule")
		}
	})

	t.Run("vitamin D3 + K2 stack", func(t *testing.T) {
		// 5000 IU D3 + 200mcg K2
		d3Mcg, _ := VitaminIUToMicrograms(5000, "D3") // 125 mcg
		k2Mcg := float32(200)                         // 200 mcg
		ratio := d3Mcg / k2Mcg                        // 0.625:1 (in mcg)

		// D3:K2 ratio in IU:mcg is typically expressed differently
		// but elemental comparison shows 125:200 = 0.625
		if !almostEqual(d3Mcg, 125, 1) {
			t.Errorf("D3 conversion = %v mcg, want 125 mcg", d3Mcg)
		}
		if !almostEqual(ratio, 0.625, 0.01) {
			t.Errorf("D3:K2 mcg ratio = %v, want 0.625", ratio)
		}
	})

	t.Run("magnesium forms comparison", func(t *testing.T) {
		// Different magnesium forms yield different elemental amounts
		// for the same compound dosage
		forms := []struct {
			name             string
			dosageMg         float32
			elementalPercent float32
			expectedMg       float32
		}{
			{"Glycinate", 400, 14.1, 56.4},
			{"Citrate", 400, 16.2, 64.8},
			{"L-Threonate", 400, 8.3, 33.2},
			{"Malate", 400, 15.5, 62.0},
		}

		for _, form := range forms {
			elemental := CalculateElementalAmount(form.dosageMg, form.elementalPercent)
			if !almostEqual(elemental, form.expectedMg, 0.1) {
				t.Errorf("%s: got %v mg elemental, want %v mg",
					form.name, elemental, form.expectedMg)
			}
		}
	})
}
