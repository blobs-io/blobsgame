package gamemap

type GameMap struct {
	Name string `json:"name"`
	MapSize struct {
		Width int `json:"width"`
		Height int `json:"height"`
	} `json:"mapSize"`
	Objects []struct {
		NoNomAreas []struct {
			StartsAt int `json:"startsAt"`
			EndsAt int `json:"endsAt"`
		} `json:"noNomAreas"`
		Walls []struct {
			X int `json:"x"`
			Y int `json:"y"`
			Width int `json:"width"`
			Height int `json:"height"`
			Type uint8 `json:"type"`
		} `json:"walls"`
	} `json:"objects"`
}