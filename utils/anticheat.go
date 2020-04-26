package utils

const (
	// Limits
	FlagLimit            = 0x14
	CoordinateDriftLimit = 50

	// Action types
	ActionCoordinateDrift = 0
)

func Penalize(action uint8, value int) int {
	switch action {
	case ActionCoordinateDrift:
		if value > 10 && value < 20 {
			return 0x1
		} else if value < 30 {
			return 0x2
		} else if value < 40 {
			return 0x4
		} else if value < 50 {
			return 0x8
		} else if value < 75 {
			return 0x10
		} else {
			return 0x20
		}
	default:
		return 0
	}
}