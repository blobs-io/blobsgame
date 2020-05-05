package gateway

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/blobs-io/blobsgame/models/player"
	"github.com/blobs-io/blobsgame/models/room"
	"github.com/blobs-io/blobsgame/utils"
)

func NomKeyEventCallback(c *WebSocketConnection, d *AnyMessage) {
	roomID, ok := d.Data["room"].(string)
	if !ok {
		return
	}

	r, ok := room.Rooms[roomID]
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
		target := r.Players[i]

		if target.ID == p.ID || (p.X > (target.X+player.Height) || p.X < (target.X-player.Height)) || (p.Y > (target.Y+player.Height) || p.Y < (target.Y-player.Height)) {
			continue
		}

		now := time.Now().UnixNano() / int64(time.Millisecond)
		if now-p.LastNom < player.NomCooldown {
			return
		}

		p.LastNom = now
		target.Health -= int8(rand.Intn(10) + 30)
		if target.Health > 0 {
			break
		}

		target.Noms++
		target.Update(0, 0, player.DeathXPReward)

		if r.Mode == room.EliminationMode {
			HandleDeath(r, target, p)
			// TODO: kick target and update br, coins, xp, etc
			break
		} else {
			target.Health = 100
		}

		var result int

		if !target.Guest && !p.Guest {
			result = utils.CalculateRatingDiff(p.BR, target.BR)
			if p.BR+result > player.BRLimit {
				result = (p.BR + result) - player.BRLimit
			}

			if target.BR-result < 0 {
				result = target.BR
			}

			p.BR += result
			target.BR -= result

			if err := p.Update(result, 0, 0); err != nil {
				fmt.Println(err)
			}

			if err := target.Update(-result, 0, 0); err != nil {
				fmt.Println(err)
			}

			winnerTier, loserTier := utils.PromotedTo(p.BR - result, p.BR), utils.PromotedTo(target.BR + result, target.BR)
			if winnerTier.NewTier.Name != "" {
				if err := p.UpdateTier(winnerTier); err != nil {
					fmt.Println(err)
				}
			}

			if loserTier.NewTier.Name != "" {
				if err := target.UpdateTier(loserTier); err != nil {
					fmt.Println(err)
				}
			}

			target.IgnoreNextFlag = true

			newX, newY := rand.Intn(r.Map.MapSize.Width), rand.Intn(r.Map.MapSize.Height)
			target.DirectionChangeCoordinates.X = newX
			target.X = newX
			target.DirectionChangeCoordinates.Y = newY
			target.Y = newY
			target.DirectionChangedAt = now

			// TODO: send new coordinates to loser
			BroadcastMessage(r, AnyMessage {
				Op: OpEvent,
				T: PlayerNomEvent,
				Data: map[string]interface{} {
					"winner": p,
					"loser": target,
					"result": result,
				},
			})
		}
	}
}
