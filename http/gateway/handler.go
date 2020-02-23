package gateway

import (
	"fmt"
	"github.com/blobs-io/blobsgame/http/web"
	"github.com/gorilla/websocket"
	"net/http"
)

var upgrader = websocket.Upgrader{
	EnableCompression: true,
	WriteBufferSize:   1024,
	ReadBufferSize:    1024,
}

func Init(route string) {
	web.Router.HandleFunc(route, func (w http.ResponseWriter, r *http.Request) {
		_, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			fmt.Println(err)
			return
		}

		// TODO: Gateway stuff
	})
}