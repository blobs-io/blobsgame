package gateway

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/blobs-io/blobsgame/models/player"
	"github.com/blobs-io/blobsgame/models/room"
	"github.com/blobs-io/blobsgame/models/session"
	"github.com/blobs-io/blobsgame/models/user"
	"github.com/blobs-io/blobsgame/utils"
	"github.com/gofiber/websocket"
)

type WebSocketConnection struct {
	Conn *websocket.Conn
	ID   string
}

var connections = make(map[string]WebSocketConnection, 0)

func Handle(c *websocket.Conn) {
	id, err := session.Generate(8)
	if err != nil {
		fmt.Println(err)
		return
	}
	sid := string(id)

	ws := WebSocketConnection{
		Conn: c,
		ID:   sid,
	}
	connections[sid] = ws

	for {
		var msg AnyMessage
		err := c.ReadJSON(&msg)
		if err != nil {
			fmt.Println(err)
			handleClose(&ws)
			break
		}

		switch msg.Op {
		case OpHello:
			handleHello(&ws, &msg)
		case OpHeartbeat:
			handleHeartbeat(&ws, &msg)
		case OpEvent:
			handleEvent(&ws, &msg)
		case OpClose:
			handleClose(&ws)
			break
		}
	}
}

func handleHello(c *WebSocketConnection, d *AnyMessage) {
	data, ok := d.Data.(HelloPayload)
	if !ok {
		return
	}

	r, ok := room.Rooms[data.Room]
	if !ok {
		return
	}

	if len(r.Players) >= room.PlayerLimit {
		c.Kick(&r, RoomFullKick, "Too many players online")
		return
	}

	if r.Mode == room.EliminationMode &&
		r.State != room.EliminationCountdownState &&
		r.State != room.EliminationWaitingState {
		c.Kick(&r, RoomIngameKick, "Room is already in-game")
		return
	}
	
	u, err := user.GetUser(data.Session, user.UserSessionSearch)

	p := player.Player {
		ID: c.ID,
		Health: 100,
		X:        rand.Intn(r.Map.MapSize.Width),
		Y:        rand.Intn(r.Map.MapSize.Height),
	}

	if err != nil && err.Error() == user.UserNotFound {
		p.Username = r.GenerateGuestName()
		p.BR = player.GuestBR
		p.Blob = player.BlobowoID
		p.Guest = true
		p.Role = user.GuestRole
	} else if u != nil {
		p.Username = u.Username
		p.BR = u.BR
		// TODO: write a function that converts a blob string to int
		//p.Blob = u.ActiveBlob
		p.Blob = player.BlobowoID
		p.Guest = false
		p.Role = u.Role
		p.Coins = u.Blobcoins
	} else {
		return
	}

	r.Players = append(r.Players, p)

	// TODO: send room data to client
}

func handleHeartbeat(c *WebSocketConnection, d *AnyMessage) {
	data, ok := d.Data.(HeartbeatPayload)
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

	p.LastPing = time.Now().UnixNano() / int64(time.Millisecond)
}

func handleEvent(c *WebSocketConnection, d *AnyMessage) {
	switch d.T {
	case CoordinateChangeEvent:
		CoordinateChangeEventCallback(c, d)
	case DirectionChangeEvent:
		DirectionChangeEventCallback(c, d)
	case PlayerKickEvent:
		PlayerKickEventCallback(c, d)
	case NomKeyEvent:
		NomKeyEventCallback(c, d)
	case ItemCollectEvent:
		ItemCollectEventCallback(c, d)
	}
}

func handleClose(c *WebSocketConnection) {
	c.Conn.Close()
	delete(connections, c.ID)
}

func (c *WebSocketConnection) Send(d AnyMessage) error {
	return c.Conn.WriteJSON(d)
}

func (c *WebSocketConnection) Kick(r *room.Room, kickType uint8, reason string) error {
	err := c.Send(AnyMessage{
		Op: OpClose,
		T:  PlayerKickEvent,
		Data: map[string]interface{}{
			"type":    kickType,
			"message": reason,
		},
	})
	if err != nil {
		return err
	}

	r.RemovePlayer(r.GetPlayerIndexByWebSocketID(c.ID))

	handleClose(c)
	return nil
}

// HandleAntiCheatFlags checks whether the user has reached the flag limit and kicks them
func (c *WebSocketConnection) HandleAntiCheatFlags(r *room.Room, flags int) bool {
	if flags > utils.FlagLimit {
		c.Kick(r, FlagLimitKick, "Too many flags")
		return true
	}
	return false
}
