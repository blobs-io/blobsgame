package gateway

import (
	"github.com/blobs-io/blobsgame/models/room"
	"github.com/blobs-io/blobsgame/models/user"
)

type PlayerKickEventData struct {
	Room   string `json:"room"`
	User   string `json:"user"`
	Reason string `json:"reason"`
}

func PlayerKickEventCallback(c *WebSocketConnection, d *AnyMessage) {
	data, ok := d.Data.(PlayerKickEventData)
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

	if p.Role != user.AdminRole {
		c.Kick(&r, ClientModKick, "Insufficient permissions")
		return
	}

	target := r.GetPlayerByUsername(data.User)
	if target == nil {
		return
	}

	conn, ok := connections[target.ID]
	if !ok {
		return
	}
	conn.Kick(&r, ModKick, data.Reason)
}
