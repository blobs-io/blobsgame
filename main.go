package main

import (
	"fmt"
	"math/rand"
	"os/exec"
	"time"

	"github.com/blobs-io/blobsgame/database"
	"github.com/blobs-io/blobsgame/http/web"
	"github.com/blobs-io/blobsgame/models/gamemap"
	"github.com/blobs-io/blobsgame/models/room"
	"github.com/blobs-io/blobsgame/utils/config"
)

func main() {
	rand.Seed(time.Now().UnixNano())

	// Log commit hash
	res, err := exec.Command("git", "rev-parse", "HEAD").Output()
	if err != nil {
		panic(err)
	}
	fmt.Printf("Running hash %s", res)

	// Parse config files
	err = config.ParseMainConfig("configs/config.json")
	if err != nil {
		panic(err)
	}
	err = config.ParseDatabaseConfig("configs/database.json")
	if err != nil {
		panic(err)
	}
	err = gamemap.LoadMaps()
	if err != nil {
		panic(err)
	} else if len(gamemap.GameMaps) < 1 {
		panic("no maps found")
	}

	// Init database connection
	err = database.Init(config.DatabaseConfig)
	if err != nil {
		panic(err)
	}

	// Create rooms
	room.Rooms = make(map[string]*room.Room)
	for i := 0; i < 3; i++ {
		room.New(room.FFAMode)
		room.New(room.EliminationMode)
	}
	fmt.Printf("Created %d rooms\n", len(room.Rooms))

	// Init web server
	web.Init(config.MainConfig.Port)
}
