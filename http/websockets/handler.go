package websockets

import "github.com/gorilla/websocket"

var upgrader = websocket.Upgrader{
	EnableCompression: true,
	WriteBufferSize:   1024,
	ReadBufferSize:    1024,
}

func Init(route string) {

}