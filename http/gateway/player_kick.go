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
	roomID, ok := d.Data["room"].(string)
	if !ok {
		return
	}

	userID, ok := d.Data["user"].(string)
	if !ok {
		return
	}

	reason, ok := d.Data["reason"].(string)
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

	if p.Role != user.AdminRole {
		c.Kick(&r, ClientModKick, "Insufficient permissions")
		return
	}

	target := r.GetPlayerByUsername(userID)
	if target == nil {
		return
	}

	conn, ok := connections[target.ID]
	if !ok {
		return
	}
	conn.Kick(&r, ModKick, reason)
}
