package item

const (
	HealthItem = 0
	CoinItem   = 1
	ItemWidth  = 20.0
	ItemHeight = 20.0
)

type Item struct {
	X    int    `json:"x"`
	Y    int    `json:"y"`
	Type uint8  `json:"type"`
	ID   string `json:"id"`
}
