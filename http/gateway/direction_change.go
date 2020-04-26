package gateway

import (
	"math"
	"time"

	"github.com/blobs-io/blobsgame/models/player"
	"github.com/blobs-io/blobsgame/models/room"
)

func DirectionChangeEventCallback(c *WebSocketConnection, d *AnyMessage) {
	return // currently disabled
	roomID, ok := d.Data["room"].(string)
	if !ok {
		return
	}

	directionChangeCoordinates, ok := d.Data["directionChangeCoordinates"].(player.CoordinatesAny)
	if !ok {
		return
	}

	directionChangedAt, ok := d.Data["directionChangedAt"].(int64)
	if !ok {
		return
	}

	direction, ok := d.Data["direction"].(uint8)
	if !ok {
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

	now := time.Now().UnixNano() / int64(time.Millisecond)

	if now-directionChangedAt < 5000 {
		p.DirectionChangedAt = directionChangedAt
	} else {
		p.DirectionChangedAt = now
	}

	p.Direction = direction

	distance := int(math.Abs(float64(p.DirectionChangeCoordinates.X-p.X)) + math.Abs(float64(p.DirectionChangeCoordinates.Y-p.Y)))
	p.Distance += distance

	p.DirectionChangeCoordinates.X = directionChangeCoordinates.X
	p.DirectionChangeCoordinates.Y = directionChangeCoordinates.Y
}
