package config

import (
	"encoding/json"
	"github.com/blobs-io/blobsgame/database"
	"io/ioutil"
)

type Tokens struct {
	Recaptcha string `json:"recaptcha"`
}

type Config struct {
	Port int `json:"port"`
	Tokens Tokens `json:"tokens"`
}

var MainConfig Config
var DatabaseConfig database.DbConfig

func ParseMainConfig(path string) error {
	file, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}
	err = json.Unmarshal(file, &MainConfig)
	if err != nil {
		return err
	}
	return nil
}

func ParseDatabaseConfig(path string) error {
	file, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}
	err = json.Unmarshal(file, &DatabaseConfig)
	if err != nil {
		return err
	}
	return nil
}