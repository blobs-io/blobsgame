package gateway

import (
	"math"
	"time"

	"github.com/blobs-io/blobsgame/models/player"
	"github.com/blobs-io/blobsgame/models/room"
)

type DirectionChangeEventData struct {
	X                          int                   `json:"x"`
	Y                          int                   `json:"y"`
	Room                       string                `json:"room"`
	DirectionChangeCoordinates player.CoordinatesAny `json:"directionChangeCoordinates"`
	DirectionChangedAt         int64                 `json:"directionChangedAt"`
	Direction                  uint8                 `json:"direction"`
}

func DirectionChangeEventCallback(c *WebSocketConnection, d *AnyMessage) {
	return // currently disabled
	data, ok := d.Data.(DirectionChangeEventData)
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

	now := time.Now().UnixNano() / int64(time.Millisecond)

	if now-data.DirectionChangedAt < 5000 {
		p.DirectionChangedAt = data.DirectionChangedAt
	} else {
		p.DirectionChangedAt = now
	}

	p.Direction = data.Direction

	distance := int(math.Abs(float64(p.DirectionChangeCoordinates.X-p.X)) + math.Abs(float64(p.DirectionChangeCoordinates.Y-p.Y)))
	p.Distance += distance

	p.DirectionChangeCoordinates.X = data.DirectionChangeCoordinates.X
	p.DirectionChangeCoordinates.Y = data.DirectionChangeCoordinates.Y
}
