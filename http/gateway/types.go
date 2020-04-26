package gateway

const (
	// Op Codes
	OpHello     = 1
	OpHeartbeat = 2
	OpEvent     = 3
	OpClose     = 4

	// Event types
	PlayerKickEvent       = "kick"
	CoordinateChangeEvent = "coordinateChange"
	DirectionChangeEvent  = "directionChange"
	NomKeyEvent           = "nomKey"
	StateChangeEvent      = "stateChange"
	PlayerNomEvent        = "playerNom"
	ItemCollectEvent      = "itemCollect"
	ItemUpdateEvent       = "itemUpdate"
	StatsChangeEvent      = "statsChange"
	HeartbeatEvent        = "heartbeat"

	// Kick types
	RoomFullKick       = 0
	RoomIngameKick     = 1
	TooManySocketsKick = 2
	ClientModKick      = 3
	ModKick            = 4
	EliminationKick    = 5
	WinKick            = 6
	RoomEndKick        = 7
	FlagLimitKick      = 8

	// Other
	// Clients send a ping every N milliseconds
	PingInterval      = 3000
	PingIntervalLimit = 10000
)

type AnyMessage struct {
	Op   int                    `json:"op"`
	Data map[string]interface{} `json:"d"`
	T    string                 `json:"t"`
}

type HelloPayload struct {
	Session string `json:"session"`
	Room    string `json:"room"`
}

type HeartbeatPayload struct {
	Room string `json:"room"`
}
