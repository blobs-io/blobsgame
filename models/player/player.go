package player

import (
	"time"
)

const (
	// Regeneration
	RegenerationInterval = time.Second * 5
	RegenerationAmount = 5

	// Directions
	DirectionUp = 0
	DirectionRight = 1
	DirectionDown = 2
	DirectionLeft = 3
)

type CoordinatesAny struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Player struct {
	Username string `json:"username"`
	BR int `json:"br"`
	Blob uint8 `json:"blob"` // Blob ID
	Role uint8 `json:"role"`
	ID string `json:"id"`
	LastNom int64 `json:"lastNom"`
	Direction uint8 `json:"direction"`
	DirectionChangeCoordinates CoordinatesAny `json:"directionChangeCoordinates"`
	DirectionChangedAt int64 `json:"directionChangedAt"`
	Guest bool `json:"guest"`
	Distance int `json:"distance"`
	//Room *room.Room `json:"room"`
	Health uint8 `json:"health"`
	// AntiCheat
	X int `json:"x"`
	Y int `json:"y"`
	LastRegeneration int64 `json:"lastRegeneration"`
	LastPing int64 `json:"lastPing"`
	Coins int `json:"coins"`
	Noms int `json:"noms"`
	XP int `json:"xp"`
}