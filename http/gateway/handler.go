package gateway

import (
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/blobs-io/blobsgame/models/player"
	"github.com/blobs-io/blobsgame/models/room"
	"github.com/blobs-io/blobsgame/models/session"
	"github.com/blobs-io/blobsgame/models/user"
	"github.com/blobs-io/blobsgame/utils"
	"github.com/gofiber/websocket"
)

type WebSocketConnection struct {
	Conn  *websocket.Conn
	Mutex sync.Mutex
	ID    string
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
	roomID, ok := d.Data["room"].(string)
	if !ok {
		return
	}
	sessionID, ok := d.Data["session"].(string)

	r, ok := room.Rooms[roomID]
	if !ok {
		return
	}

	if len(r.Players) >= room.PlayerLimit {
		c.Kick(r, RoomFullKick, "Too many players online")
		return
	}

	if r.Mode == room.EliminationMode &&
		r.State != room.CountdownState &&
		r.State != room.WaitingState {
		c.Kick(r, RoomIngameKick, "Room is already in-game")
		return
	}

	u, err := user.GetUser(sessionID, user.UserSessionSearch)

	p := player.Player{
		ID:     c.ID,
		Health: 100,
		X:      rand.Intn(r.Map.MapSize.Width),
		Y:      rand.Intn(r.Map.MapSize.Height),
		Conn:   c.Conn,
	}

	if err != nil && err.Error() == user.UserNotFound {
		p.Username = r.GenerateGuestName()
		p.BR = player.GuestBR
		p.Blob = user.StartBlob
		p.Guest = true
		p.Role = user.GuestRole
	} else if u != nil {
		p.Username = u.Username
		p.BR = u.BR
		p.Blob = user.StartBlob
		p.Guest = false
		p.Role = u.Role
		p.Coins = u.Blobcoins
	} else {
		return
	}

	r.Players = append(r.Players, &p)

	fmt.Println(r)
	c.Send(AnyMessage{
		Op: OpEvent,
		T:  HeartbeatEvent,
		Data: map[string]interface{}{
			"user":             p,
			"users":            r.Players,
			"objects":          r.Map.Objects,
			"interval":         PingInterval,
			"items":            r.Items,
			"roomCreatedAt":    r.CreatedAt,
			"state":            r.State,
			"countdownStarted": r.CountdownStarted,
		},
	})
	// TODO: check if room is elimination room and if it meets requirements for room start
}

func handleHeartbeat(c *WebSocketConnection, d *AnyMessage) {
	roomID, ok := d.Data["room"].(string)
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
	c.Mutex.Lock()
	defer c.Mutex.Unlock()
	return c.Conn.WriteJSON(d)
}

func (c *WebSocketConnection) Kick(r *room.Room, kickType uint8, reason string) error {
	fmt.Println(AnyMessage{
		Op: OpClose,
		T:  PlayerKickEvent,
		Data: map[string]interface{}{
			"type":    kickType,
			"message": reason,
		},
	})
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

func WatchRoom(r *room.Room) {
	for {
		for _, p := range r.Players {
			conn, ok := connections[p.ID]
			if !ok {
				continue
			}

			conn.Send(AnyMessage{
				Op: OpEvent,
				T:  CoordinateChangeEvent,
				Data: map[string]interface{}{
					"players": r.Players,
				},
			})
		}

		time.Sleep(time.Millisecond * 25)
	}
}
