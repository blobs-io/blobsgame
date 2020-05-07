package player

import (
	"errors"
	"github.com/blobs-io/blobsgame/database"
	"github.com/blobs-io/blobsgame/utils"
	"time"

	"github.com/gofiber/websocket"
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
)

type CoordinatesAny struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Player struct {
	Username                   string          `json:"username"`
	BR                         int             `json:"br"`
	Blob                       string          `json:"blob"`
	Role                       int8            `json:"role"`
	ID                         string          `json:"id"`
	LastNom                    int64           `json:"lastNom"`
	Direction                  uint8           `json:"direction"`
	DirectionChangeCoordinates CoordinatesAny  `json:"directionChangeCoordinates"`
	DirectionChangedAt         int64           `json:"directionChangedAt"`
	Guest                      bool            `json:"guest"`
	Distance                   int             `json:"distance"`
	Health                     int8            `json:"health"`
	AntiCheatFlags             int             `json:"antiCheatFlags"`
	IgnoreNextFlag             bool            `json:"ignoreNextFlag"`
	X                          int             `json:"x"`
	Y                          int             `json:"y"`
	LastRegeneration           int64           `json:"lastRegeneration"`
	LastPing                   int64           `json:"lastPing"`
	Coins                      int             `json:"coins"`
	Noms                       int             `json:"noms"`
	XP                         int             `json:"xp"`
	Conn                       *websocket.Conn `json:"-"`
}

func (p *Player) Update(br int, coins int, xp int) error {
	if p.Guest {
		return errors.New("target is a guest")
	}
	rows, err := database.Database.Query(`UPDATE accounts SET "br" = "br" + $1, "blobcoins" = "blobcoins" + $2, "xp" = "xp" + $3 WHERE "username" = $4`, br, coins, xp, p.Username)
	if err != nil {
		return err
	}

	rows.Close()
	return nil
}

func (p *Player) UpdateTier(tier utils.Promotion) error {
	rows, err := database.Database.Query(`INSERT INTO recentPromotions ("user", "newTier", "drop") VALUES ($1, $2, $3)`, p.Username, tier.NewTier.Name, tier.Drop)
	if err != nil {
		return err
	}

	rows.Close()
	return nil
}

func (p *Player) SaveDistance() error {
	rows, err := database.Database.Query(`UPDATE accounts SET "distance" = "distance" + $1 WHERE "username" = $2`, p.Distance, p.Username)
	if err != nil {
		return err
	}

	rows.Close()
	return nil
}