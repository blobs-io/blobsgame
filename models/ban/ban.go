package ban

import (
	"github.com/blobs-io/blobsgame/database"
)

type Ban struct {
	Username string `json:"username"`
	Reason string `json:"reason"`
	BannedAt string `json:"bannedAt"`
	Expires string `json:"expires"`
	Moderator string `json:"moderator"`
}

func Get(username string) (*Ban, error) {
	var ban Ban
	rows, err := database.Database.Query("SELECT * FROM bans WHERE username = $1", username)

	if err != nil {
		return nil, err
	}

	if !rows.Next() {
		return nil, nil
	}

	err = rows.Scan(&ban.Username, &ban.Reason, &ban.BannedAt, &ban.Expires, &ban.Moderator)
	if err != nil {
		return nil, err
	}

	return &ban, nil
}

func Delete(username string) error {
	 _, err := database.Database.Query("DELETE FROM bans WHERE username = $1", username)
	return err
}