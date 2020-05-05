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
	MinPlayerStartup = 2
	WaitingTime      = 12000

	// States
	WaitingState   = 0
	CountdownState = 1
	IngameState    = 2

	// Reward types
	// Used for GetRewardForPlacement+
	CoinRewardType = 0
	BRRewardType = 1

	// Rewards
	DefaultXPGain = 100
	WinXPGain = 250
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

var (
	Rooms map[string]*Room

	// Rewards for elimination rooms
	// index represents placement
	// e.g. first place would get CoinRewards[0] coins
	CoinRewards = []int{
		75,
		50,
		25,
	}
	BRRewards = []int{
		150,
		100,
		50,
		25,
		10,
	}
)

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

	if mode == EliminationMode {
		r.State = WaitingState
	}

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

func (r *Room) StartsAt() int64 {
	if r.State == WaitingState {
		return 0
	}

	return r.CountdownStarted + WaitingTime
}

func (r *Room) IsSingle() bool {
	return len(r.Players) == 1
}

func FindLobbyByWebsocketID(id string) *Room {
	for i, r := range Rooms {
		pl := r.GetPlayerIndexByWebSocketID(id)
		if pl < 0 {
			continue
		}

		return Rooms[i]
	}
	return nil
}

func GetRewardForPlacement(rewardType uint8, placement int) int {
	if placement < 0 {
		return 0
	}

	switch rewardType {
	case CoinRewardType:
		if placement >= len(CoinRewards) {
			return 0
		}

		return CoinRewards[placement]
	case BRRewardType:
		if placement >= len(BRRewards) {
			return 0
		}

		return BRRewards[placement]
	default:
		return 0
	}
}