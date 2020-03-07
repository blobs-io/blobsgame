package room

import (
	"github.com/blobs-io/blobsgame/models/gamemap"
	"github.com/blobs-io/blobsgame/models/item"
	"github.com/blobs-io/blobsgame/models/player"
	"strconv"
)

const (
	FFAMode = 0
	EliminationMode = 1
	
	FFAPrefix = "FFA"
	EliminationPrefix = "ELIM"
)

type Room struct {
	Map gamemap.GameMap `json:"map"`
	ID string `json:"id"`
	Players []player.Player `json:"players"`
	Items []item.Item `json:"items"`
	Mode uint8 `json:"mode"`
	CreatedAt int64 `json:"createdAt"`
}

var Rooms map[string]Room

func New(mode uint8) *Room {
	r := Room {
		Mode: mode,
	}
	r.ID = r.ModeToString() + strconv.Itoa(len(Rooms))

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