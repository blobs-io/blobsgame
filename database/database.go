package database

import (
	"database/sql"
	"fmt"

	// postgres driver
	_ "github.com/lib/pq"
)

type DbConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	DBName   string `json:"dbname"`
	User     string `json:"user"`
	Password string `json:"password"`
	SSL      string `json:"ssl"`
}

// Database is the database driver
var Database *sql.DB

// Init initializes SQL connection
func Init(config DbConfig) error {
	var err error
	Database, err = sql.Open("postgres", fmt.Sprintf("host=%s port=%d dbname=%s user=%s password=%s sslmode=%s", config.Host, config.Port, config.DBName, config.User, config.Password, config.SSL))
	if err != nil {
		return err
	}
	return nil
}