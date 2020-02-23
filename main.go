package main

import (
	"fmt"
	"github.com/blobs-io/blobsgame/database"
	"github.com/blobs-io/blobsgame/http/web"
	"github.com/blobs-io/blobsgame/utils/config"
	"os/exec"
)

func main() {
	// Log commit hash
	res, err := exec.Command("git", "rev-parse", "HEAD").Output()
	if err != nil {
		panic(err)
	}
	fmt.Printf("Running hash %s\n", res)

	// Parse config files
	err = config.ParseMainConfig("configs/config.json")
	if err != nil {
		panic(err)
	}
	err = config.ParseDatabaseConfig("configs/database.json")

	// Init database connection
	err = database.Init(config.DatabaseConfig)
	if err != nil {
		panic(err)
	}
	
	// Init web server
	web.Init(config.MainConfig.Port)
}