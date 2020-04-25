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
	FFAMode         = 0
	EliminationMode = 1

	FFAPrefix         = "FFA"
	EliminationPrefix = "ELIM"

	EliminationWaitingState   = 0
	EliminationCountdownState = 1
	EliminationIngameState    = 2

	PlayerLimit = 100
)

type Room struct {
	Map       gamemap.GameMap `json:"map"`
	ID        string          `json:"id"`
	Players   []player.Player `json:"players"`
	Items     []item.Item     `json:"items"`
	Mode      uint8           `json:"mode"`
	State     uint8           `json:"state"`
	CreatedAt int64           `json:"createdAt"`
}

var Rooms map[string]Room

func New(mode uint8) *Room {
	r := Room{
		Mode: mode,
	}
	r.ID = strings.ToLower(r.ModeToString()) + strconv.Itoa(len(Rooms))
	r.CreatedAt = time.Now().UnixNano() / int64(time.Millisecond)

	r.Players = make([]player.Player, 0)
	r.Items = make([]item.Item, 0)

	Rooms[r.ID] = r

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

		for _, p := range r.Players {
			if p.Username == name {
				continue
			}
		}

		return name
	}
}

func (r *Room) GetPlayerByUsername(username string) *player.Player {
	for i, p := range r.Players {
		if p.Username == username {
			return &r.Players[i]
		}
	}
	return nil
}

func (r *Room) GetPlayerByWebSocketID(id string) *player.Player {
	for i, p := range r.Players {
		if p.ID == id {
			return &r.Players[i]
		}
	}
	return nil
}
