package user

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/blobs-io/blobsgame/database"
	"github.com/blobs-io/blobsgame/models/ban"
	"github.com/blobs-io/blobsgame/models/session"
	"golang.org/x/crypto/bcrypt"
	"regexp"
	"strconv"
	"strings"
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

type ExposableUser struct { // this is sent to users
	Username string `json:"username"`
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
	// Error texts
	BanText = "user is currently banned"
	InvalidUserPass = "invalid username or password"
	UserNotFound = "no user with that username was found"
	InvalidUsernameLength = "username needs to be at least 3 characters long and must not exceed 14 characters"
	InvalidPasswordLength = "password needs to be at least 4 characters long and must not exceed 128 characters"
	InvalidUsernamePattern = "username does not match pattern. Please only use letters, numbers and spaces"
	UsernameTaken = "username is already taken"
	UnknownError = "an unknown error occurred"
	BlobNoAccess = "you cannot use this blob"
	DailyGiftFailed = "you have already requested your daily gift, come back later" // TODO: display time left

	// Properties
	StartRating = 1000
	StartCoins = 0
	StartBlob = "blobowo"
	StartXP = 0
	DailyCoins = 100

	// Roles
	GuestRole = -1
	UserRole = 0
	AdminRole = 1

	// GetUser flags
	UserDefaultSearch = 1
	UserSessionSearch = 2
)

var (
	UsernameRegex = regexp.MustCompile("^[\\w ]+$")
)

func GetUser(target string, flags uint32) (*User, error) {
	var rows *sql.Rows
	var err error
	switch flags {
	case UserDefaultSearch:
		rows, err = database.Database.Query("SELECT * FROM accounts WHERE upper(username) = $1", strings.ToUpper(target))
	case UserSessionSearch:
		rows, err = database.Database.Query("SELECT * FROM accounts WHERE username = (SELECT username FROM sessionids WHERE sessionid = $1)", target)
	}
	if err != nil {
		return nil, err
	}

	if !rows.Next() {
		return nil, errors.New(UserNotFound)
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

func (u *User) Expose(showHiddenProperties bool) ExposableUser {
	usr := ExposableUser {
		Username:       u.Username,
		BR:             u.BR,
		CreatedAt:      u.CreatedAt,
		Role:           u.Role,
		Distance:       u.Distance,
		ActiveBlob:     u.ActiveBlob,
		Clan:           u.Clan,
		Wins:           u.Wins,
		Losses:         u.Losses,
		XP:             u.XP,
	}
	if showHiddenProperties {
		usr.Blobcoins = u.Blobcoins
		usr.LastDailyUsage = u.LastDailyUsage
		usr.Blobs = u.Blobs
	}
	return usr
}

func (u *User) SwitchBlob(newBlob string) error {
	newBlob = strings.TrimSpace(newBlob)

	parsedBlobs, ok := strings.Split(u.Blobs, ","), false

	for _, blob := range parsedBlobs {
		if strings.TrimSpace(blob) == newBlob {
			ok = true
			break
		}
	}

	if !ok {
		return errors.New(BlobNoAccess)
	}

	_, err := database.Database.Query("UPDATE accounts SET \"activeBlob\" = $1 WHERE username = $2", newBlob, u.Username)
	return err
}

func (u *User) RedeemDailyGift() error {
	parsedTime, err := strconv.ParseInt(u.LastDailyUsage, 10, 64)
	if err != nil {
		return err
	}

	now := time.Now().UnixNano() / 1_000_000

	if now < parsedTime + 86_400_000 {
		return errors.New(DailyGiftFailed)
	}

	_, err = database.Database.Query("UPDATE accounts SET blobcoins = blobcoins + $1, \"lastDailyUsage\" = $2 WHERE username = $3",
		DailyCoins,
		strconv.FormatInt(now, 10),
		u.Username)

	return err
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

	dbUser, err := GetUser(username, UserDefaultSearch)
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

func Register(username string, password string) error {
	// (req.body.username.length < 3 || req.body.username.length > 14)
	if len(username) < 3 || len(username) > 14 {
		return errors.New(InvalidUsernameLength)
	}

	if len(password) < 4 || len(password) > 128 {
		return errors.New(InvalidPasswordLength)
	}

	if !UsernameRegex.Match([]byte(username)) {
		return errors.New(InvalidUsernamePattern)
	}

	// TODO: captcha

	_, err := GetUser(username, UserDefaultSearch)
	if err != nil {
		if err.Error() != UserNotFound {
			fmt.Println(err)
			return errors.New(UnknownError)
		}
	} else {
		return errors.New(UsernameTaken)
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println(err)
		return errors.New(UnknownError)
	}
	_, err = database.Database.Query("INSERT INTO accounts VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
		// Username
		username,
		// Password hash
		passwordHash,
		// BR
		StartRating,
		// Creation timestamp
		strconv.FormatInt(time.Now().UnixNano() / int64(time.Millisecond), 10),
		// Role
		UserRole,
		// Coins
		StartCoins,
		// Last daily usage
		0,
		// Start distance
		0,
		// Blobs
		"[\"" + StartBlob + "\"]",
		// Active blob
		StartBlob,
		// Clan
		nil,
		// Wins
		0,
		// Losses
		0,
		// Start XP
		StartXP,
	)

	if err != nil {
		fmt.Println(err)
		return errors.New(UnknownError)
	}


	return nil
}