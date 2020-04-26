package gateway

import (
	"math/rand"
	"time"

	"github.com/blobs-io/blobsgame/models/player"
	"github.com/blobs-io/blobsgame/models/room"
	"github.com/blobs-io/blobsgame/utils"
)

type NomKeyEventData struct {
	Room string `json:"room"`
}

func NomKeyEventCallback(c *WebSocketConnection, d *AnyMessage) {
	data, ok := d.Data.(NomKeyEventData)
	if !ok {
		return
	}

	r, ok := room.Rooms[data.Room]
	if !ok {
		return
	}

	if r.Mode == room.EliminationMode && r.State != room.IngameState {
		return
	}

	p := r.GetPlayerByWebSocketID(c.ID)
	if p == nil {
		return
	}

	for i := range r.Players {
		target := &r.Players[i]

		if (p.X > (target.X+player.Height) || p.X < (target.X-player.Height)) || (p.Y > (target.Y+player.Height) || p.Y < (target.Y-player.Height)) {
			return
		}

		now := time.Now().UnixNano() / int64(time.Millisecond)
		if now-p.LastNom < player.NomCooldown {
			return
		}

		p.LastNom = now
		target.Health -= uint8(rand.Intn(10) + 30)
		if target.Health > 0 {
			break
		}

		target.Noms++
		target.Update(0, 0, player.DeathXPReward)

		if r.Mode == room.EliminationMode {
			// TODO: kick target and update br, coins, xp, etc
			break
		} else {
			target.Health = 100
		}

		var result int

		if !target.Guest && !p.Guest {
			result = utils.CalculateRatingDiff(p.BR, target.BR)
			if p.BR + result > player.BRLimit {
				p.BR = player.BRLimit
			} else {
				p.BR += result
			}

			if target.BR - result < 0 {
				target.BR = 0
			} else {
				target.BR -= result
			}

			// TODO: tier promotion checking

			newX, newY := rand.Intn(r.Map.MapSize.Width), rand.Intn(r.Map.MapSize.Height)
			target.DirectionChangeCoordinates.X = newX
			target.X = newX
			target.DirectionChangeCoordinates.Y = newY
			target.Y = newY
			target.DirectionChangedAt = now

			// TODO: send new coordinates to target
		}
	}
}
