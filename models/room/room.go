package room

import (
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/blobs-io/blobsgame/models/gamemap"
	"github.com/blobs-io/blobsgame/models/item"
	"github.com/blobs-io/blobsgame/models/player"
)

const (
	// Modes
	FFAMode         = 0
	EliminationMode = 1

	// Prefixes
	FFAPrefix         = "FFA"
	EliminationPrefix = "ELIM"

	// Limits etc
	PlayerLimit      = 100
	MinPlayerStartup = 4
	WaitingTime      = time.Second * 2

	// States
	WaitingState   = 0
	CountdownState = 1
	IngameState    = 2

	// Rewards

)

type Room struct {
	// Base
	Map       gamemap.GameMap  `json:"map"`
	ID        string           `json:"id"`
	Players   []*player.Player `json:"players"`
	Items     []*item.Item     `json:"items"`
	Mode      uint8            `json:"mode"`
	State     uint8            `json:"state"`
	CreatedAt int64            `json:"createdAt"`

	// Elimination room
	CountdownStarted int64 `json:"countdownStarted,omitempty"`
}

var Rooms map[string]*Room

func New(mode uint8) *Room {
	r := Room{
		Mode: mode,
	}
	r.ID = strings.ToLower(r.ModeToString()) + strconv.Itoa(len(Rooms))
	r.CreatedAt = time.Now().UnixNano() / int64(time.Millisecond)

	// TODO: custom maps?
	r.Map = gamemap.GameMaps["default"]
	r.Players = make([]*player.Player, 0)
	r.Items = make([]*item.Item, 0)

	Rooms[r.ID] = &r

	return &r
}

func (r *Room) ModeToString() string {
	switch r.Mode {
	case FFAMode:
		return FFAPrefix
	case EliminationMode:
		return EliminationPrefix
	default:
		return ""
	}
}

func (r *Room) GenerateGuestName() string {
	if len(r.Players) <= 0 {
		return "Guest"
	}

	for {
		name := "Guest" + strconv.Itoa(rand.Intn(PlayerLimit*10))

		taken := false
		for _, p := range r.Players {
			if p.Username == name {
				taken = true
				break
			}
		}

		if !taken {
			return name
		}
	}
}

func (r *Room) GetPlayerByUsername(username string) *player.Player {
	for i, p := range r.Players {
		if p.Username == username {
			return r.Players[i]
		}
	}
	return nil
}

func (r *Room) GetPlayerByWebSocketID(id string) *player.Player {
	index := r.GetPlayerIndexByWebSocketID(id)
	if index > -1 {
		return r.Players[index]
	}
	return nil
}

// GetPlayerIndexByWebSocketID returns -1 if it was not found
func (r *Room) GetPlayerIndexByWebSocketID(id string) int {
	for i, p := range r.Players {
		if p.ID == id {
			return i
		}
	}
	return -1
}

func (r *Room) RemovePlayer(index int) bool {
	if index < 0 || index >= len(r.Players) {
		return false
	}

	r.Players[index] = r.Players[len(r.Players)-1]
	r.Players = r.Players[:len(r.Players)-1]
	return true
}
