package config

import (
	"encoding/json"
	"io/ioutil"
)

type Config struct {
	Port int `json:"port"`
}

var MainConfig Config

func ParseConfig(path string) error {
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