package gateway

import (
	"math"

	"github.com/blobs-io/blobsgame/models/room"
	"github.com/blobs-io/blobsgame/models/user"
	"github.com/blobs-io/blobsgame/utils"
)

type CoordinateChangeEventData struct {
	X    int    `json:"x"`
	Y    int    `json:"y"`
	Room string `json:"room"`
}

func CoordinateChangeEventCallback(c *WebSocketConnection, d *AnyMessage) {
	data, ok := d.Data.(CoordinateChangeEventData)
	if !ok {
		return
	}

	r, ok := room.Rooms[data.Room]
	if !ok {
		return
	}

	p := r.GetPlayerByWebSocketID(c.ID)
	if p == nil {
		return
	}

	xDrift, yDrift := math.Abs(float64(data.X-p.X)), math.Abs(float64(data.Y-p.Y))

	if xDrift > utils.CoordinateDriftLimit {
		p.AntiCheatFlags += utils.Penalize(utils.ActionCoordinateDrift, int(xDrift))
	}

	if yDrift > utils.CoordinateDriftLimit {
		p.AntiCheatFlags += utils.Penalize(utils.ActionCoordinateDrift, int(yDrift))
	}

	kicked := c.HandleAntiCheatFlags(&r, p.AntiCheatFlags)
	if kicked {
		return
	}

	if p.Role != user.AdminRole {
		if data.X < 0 {
			data.X = 0
		} else if data.X > r.Map.MapSize.Width {
			data.X = r.Map.MapSize.Width
		}

		if data.Y < 0 {
			data.Y = 0
		} else if data.Y > r.Map.MapSize.Height {
			data.Y = r.Map.MapSize.Height
		}
	}

	// this might cause some problems later, not too sure yet
	p.X = data.X
	p.Y = data.Y
}
