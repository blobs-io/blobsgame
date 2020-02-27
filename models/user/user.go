package user

import (
	"database/sql"
	"errors"
	"github.com/blobs-io/blobsgame/database"
	"github.com/blobs-io/blobsgame/models/ban"
	"github.com/blobs-io/blobsgame/models/session"
	"golang.org/x/crypto/bcrypt"
	"strconv"
	"time"
)

type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
	BR int `json:"br"`
	CreatedAt string `json:"createdAt"`
	Role uint8 `json:"role"`
	Blobcoins int `json:"blobcoins"`
	LastDailyUsage string `json:"lastDailyUsage"`
	Distance int `json:"distance"`
	Blobs string `json:"blobs"` //TODO: use string[] instead of string (needs database change)
	ActiveBlob string `json:"activeBlob"`
	Clan sql.NullString `json:"clan"`
	Wins int `json:"wins"`
	Losses int `json:"losses"`
	XP int `json:"xp"`
}

const (
	BanText = "user is currently banned"
	InvalidUserPass = "invalid username or password"
)

func GetUser(username string) (*User, error) {
	rows, err := database.Database.Query("SELECT * FROM accounts WHERE username = $1", username)
	if err != nil {
		return nil, err
	}

	if !rows.Next() {
		return nil, errors.New("no user with that username was found")
	}
	var user User
	err = rows.Scan(&user.Username,
		&user.Password,
		&user.BR,
		&user.CreatedAt,
		&user.Role,
		&user.Blobcoins,
		&user.LastDailyUsage,
		&user.Distance,
		&user.Blobs,
		&user.ActiveBlob,
		&user.Clan,
		&user.Wins,
		&user.Losses,
		&user.XP)

	if err != nil {
		return nil, err
	}
	return &user, nil
}

func Login(username string, password string) (*session.Session, error) {
	dbBan, err := ban.Get(username)
	if err != nil {
		return nil, err
	}

	if dbBan != nil {
		dateStr, err := strconv.ParseInt(dbBan.Expires, 10, 64)
		if err != nil {
			return nil, err
		}
		if time.Now().UnixNano() / 1000000 > dateStr {
			err := ban.Delete(username)
			if err != nil {
				return nil, err
			}
		} else {
			return nil, errors.New(BanText)
		}
	}

	dbUser, err := GetUser(username)
	if err != nil {
		return nil, err
	}

	if bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(password)) != nil {
		return nil, errors.New(InvalidUserPass)
	}

	_, err = session.Get(username, session.UsernameCriteria)
	if err != nil {
		if err.Error() != session.NotFoundError {
			return nil, err
		}
	} else {
		err = session.Delete(username, session.UsernameCriteria)
		if err != nil {
			return nil, err
		}
	}

	return session.Register(username, (time.Now().UnixNano() / 1000000) + session.SessionDuration)
}