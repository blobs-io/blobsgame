package gateway

import (
	"math"

	"github.com/blobs-io/blobsgame/models/room"
	"github.com/blobs-io/blobsgame/models/user"
	"github.com/blobs-io/blobsgame/utils"
)

func CoordinateChangeEventCallback(c *WebSocketConnection, d *AnyMessage) {
	roomID, ok := d.Data["room"].(string)
	var x, y int

	if temp, ok := d.Data["x"].(float64); ok {
		x = int(temp)
	} else {
		return
	}

	if temp, ok := d.Data["y"].(float64); ok {
		y = int(temp)
	} else {
		return
	}

	r, ok := room.Rooms[roomID]
	if !ok {
		return
	}

	p := r.GetPlayerByWebSocketID(c.ID)
	if p == nil {
		return
	}

	xDrift, yDrift := math.Abs(float64(x-p.X)), math.Abs(float64(y-p.Y))

	if xDrift > utils.CoordinateDriftLimit && !p.IgnoreNextFlag {
		p.AntiCheatFlags += utils.Penalize(utils.ActionCoordinateDrift, int(xDrift))
		p.IgnoreNextFlag = false
	}

	if yDrift > utils.CoordinateDriftLimit && !p.IgnoreNextFlag {
		p.AntiCheatFlags += utils.Penalize(utils.ActionCoordinateDrift, int(yDrift))
		p.IgnoreNextFlag = false
	}

	kicked := c.HandleAntiCheatFlags(r, p.AntiCheatFlags)
	if kicked {
		return
	}

	p.Distance += int(xDrift + yDrift)

	if p.Role != user.AdminRole {
		if x < 0 {
			x = 0
		} else if x > r.Map.MapSize.Width {
			x = r.Map.MapSize.Width
		}

		if y < 0 {
			y = 0
		} else if y > r.Map.MapSize.Height {
			y = r.Map.MapSize.Height
		}
	}

	// this might cause some problems later, not too sure yet
	p.X = x
	p.Y = y
}
