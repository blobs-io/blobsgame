package gateway

import (
	"fmt"
	"time"

	"github.com/blobs-io/blobsgame/models/player"
	"github.com/blobs-io/blobsgame/models/room"
	"github.com/blobs-io/blobsgame/models/session"
	"github.com/blobs-io/blobsgame/models/user"
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
		// TODO: send error message to client (too many players online)
		return
	}

	if r.Mode == room.EliminationMode &&
		r.State != room.EliminationCountdownState &&
		r.State != room.EliminationWaitingState {
		// TODO: send error message to client (room is already in game)
		return
	}

	// TODO: allow non-guests
	// get user by session id
	p := player.Player{
		Username: r.GenerateGuestName(),
		ID:       c.ID,
		BR:       player.GuestBR,
		Blob:     player.BlobowoID,
		Guest:    true,
		Health:   100,
		Role:     user.GuestRole,
		// TODO: randomize coordinates
		X: 50,
		Y: 50,
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
	case ItemCollectEvent:
	}
}

func handleClose(c *WebSocketConnection) {
	delete(connections, c.ID)
}
