package gateway

import (
	"math/rand"

	"github.com/blobs-io/blobsgame/models/item"
	"github.com/blobs-io/blobsgame/models/room"
)

func ItemCollectEventCallback(c *WebSocketConnection, d *AnyMessage) {
	roomID, ok := d.Data["room"].(string)
	if !ok {
		return
	}

	itemID, ok := d.Data["item"].(string)
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

	var targetItem *item.Item
	for i := range r.Items {
		currentItem := &r.Items[i]
		if currentItem.ID == itemID &&
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
