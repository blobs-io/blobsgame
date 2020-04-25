package utils

import "math"

func CalculateRatingDiff(own int, opponent int) int {
	gainValue := 0
	diff := own - opponent

	if diff < 0 {
		gainValue = int(math.Pow(math.Log10(float64(-diff)), 4))
	} else {
		gainValue = int(math.Log1p(9998 / math.Dim(float64(own), float64(opponent))))
	}

	if gainValue > 999 || gainValue < 0 {
		return 32
	}

	if gainValue == 0 {
		return 1
	}
	return gainValue
}
