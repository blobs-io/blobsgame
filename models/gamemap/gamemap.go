package gamemap

import (
	"encoding/json"
	"io/ioutil"
	"strings"
)

var GameMaps = make(map[string]GameMap)

type GameMapSize struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type GameMapObject struct {
	NoNomAreas []GameMapNoNomArea `json:"noNomArea"`
	Walls      []GameMapWall      `json:"walls"`
}

type GameMapNoNomArea struct {
	StartsAt int `json:"startsAt"`
	EndsAt   int `json:"endsAt"`
}

type GameMapWall struct {
	X      int   `json:"x"`
	Y      int   `json:"y"`
	Width  int   `json:"width"`
	Height int   `json:"height"`
	Type   uint8 `json:"type"`
}

type GameMap struct {
	Name    string        `json:"name"`
	MapSize GameMapSize   `json:"mapSize"`
	Objects GameMapObject `json:"objects"`
}

func LoadMaps() error {
	files, err := ioutil.ReadDir("maps")
	if err != nil {
		return err
	}

	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".json") { // only allow maps in JSON format
			contents, err := ioutil.ReadFile("maps/" + file.Name())
			if err != nil {
				return err
			}

			var gameMap GameMap
			err = json.Unmarshal(contents, &gameMap)
			if err != nil {
				return err
			}
			GameMaps[gameMap.Name] = gameMap
		}
	}

	return nil
}
