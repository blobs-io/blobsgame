package session

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"github.com/blobs-io/blobsgame/database"
	"strconv"
)

type Session struct {
	Username string `json:"username"`
	SessionID string `json:"sessionid"`
	Expires string `json:"expires"`
}

const (
	SessionLength = 32
	SessionDuration = 900000
	NotFoundError = "session not found"
	CryptoError = "could not generate session id"
	IDCriteria = 0
	UsernameCriteria = 1
)

func Generate(length int) ([]byte, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		fmt.Println(err)
		return nil, errors.New(CryptoError) // dont leak error, might be sensitive
	}
	str := base64.URLEncoding.EncodeToString(bytes)
	return []byte(str), nil
}

func Get(src string, criteria uint8) (*Session, error) {
	var session Session
	var err error
	var rows *sql.Rows

	switch criteria {
	case IDCriteria:
		rows, err = database.Database.Query("SELECT * FROM sessionids WHERE sessionid = $1", src)
	case UsernameCriteria:
		rows, err = database.Database.Query("SELECT * FROM sessionids WHERE username = $1", src)
	}

	if err != nil {
		return nil, err
	}

	if !rows.Next() {
		return nil, errors.New(NotFoundError)
	}

	err = rows.Scan(&session.Username, &session.SessionID, &session.Expires)
	if err != nil {
		return nil, err
	}

	return &session, nil
}

func Delete(src string, criteria uint8) error {
	switch criteria {
	case IDCriteria:
		if _, err := database.Database.Query("DELETE FROM sessionids WHERE sessionid = $1", src); err != nil {
			return err
		}
	case UsernameCriteria:
		if _, err := database.Database.Query("DELETE FROM sessionids WHERE username = $1", src); err != nil {
			return err
		}
	}
	return nil
}

func Register(username string, expires int64) (*Session, error) {
	newSession, err := Generate(SessionLength)
	if err != nil {
		return nil, err
	}

	expiresStr := strconv.FormatInt(expires, 10)

	_, err = database.Database.Query("INSERT INTO sessionids VALUES ($1, $2, $3)", username, newSession, expiresStr)
	if err != nil {
		return nil, err
	}
	return &Session {
		Expires: expiresStr,
		SessionID: string(newSession),
		Username: username,
	}, nil
}