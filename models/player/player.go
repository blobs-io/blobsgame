package player

import (
	"time"
)

const (
	// Regeneration
	RegenerationInterval = time.Second * 5
	RegenerationAmount   = 5

	GuestBR       = 0
	Width         = 30
	Height        = 30
	NomCooldown   = 1500
	DeathXPReward = 50
	BRLimit       = 9999

	// Directions
	DirectionUp    = 0
	DirectionRight = 1
	DirectionDown  = 2
	DirectionLeft  = 3

	// Blob IDs
	BlobowoID = 0
)

type CoordinatesAny struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Player struct {
	Username                   string         `json:"username"`
	BR                         int            `json:"br"`
	Blob                       uint8          `json:"blob"` // Blob ID
	Role                       int8           `json:"role"`
	ID                         string         `json:"id"`
	LastNom                    int64          `json:"lastNom"`
	Direction                  uint8          `json:"direction"`
	DirectionChangeCoordinates CoordinatesAny `json:"directionChangeCoordinates"`
	DirectionChangedAt         int64          `json:"directionChangedAt"`
	Guest                      bool           `json:"guest"`
	Distance                   int            `json:"distance"`
	Health                     uint8          `json:"health"`
	AntiCheatFlags             int            `json:"antiCheatFlags"`
	X                          int            `json:"x"`
	Y                          int            `json:"y"`
	LastRegeneration           int64          `json:"lastRegeneration"`
	LastPing                   int64          `json:"lastPing"`
	Coins                      int            `json:"coins"`
	Noms                       int            `json:"noms"`
	XP                         int            `json:"xp"`
}

func (p *Player) Update(br int, coins int, xp int) {
	// TODO: write function that updates user stats
}
