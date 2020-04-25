package gateway

import (
	"math/rand"

	"github.com/blobs-io/blobsgame/models/item"
	"github.com/blobs-io/blobsgame/models/room"
)

type ItemCollectEventData struct {
	Room string `json:"room"`
	Item string `json:"item"`
}

func ItemCollectEventCallback(c *WebSocketConnection, d *AnyMessage) {
	data, ok := d.Data.(ItemCollectEventData)
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

	var targetItem *item.Item
	for i := range r.Items {
		currentItem := &r.Items[i]
		if currentItem.ID == data.Item &&
			p.X < (currentItem.X+item.ItemWidth) &&
			p.X > (currentItem.X-item.ItemWidth) &&
			p.Y < (currentItem.Y+item.ItemHeight) &&
			p.Y > (currentItem.Y-item.ItemHeight) {
			targetItem = currentItem
		}
	}

	if targetItem == nil {
		return
	}

	// TODO: create new item and append it to r.Items
	// and remove targetItem from array

	switch targetItem.Type {
	case item.HealthItem:
		p.Health += uint8(rand.Intn(5) + 10)
	case item.CoinItem:
		// TODO: generate random coins
	}
}
