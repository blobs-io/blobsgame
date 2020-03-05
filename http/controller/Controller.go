package controller

import (
	"fmt"
	"github.com/blobs-io/blobsgame/models/user"
	"github.com/gofiber/fiber"
	"strings"
)

const (
	Unauthorized = "401: Unauthorized"
	NotFound = "404: Not Found"

	BodyParseFailure = "body parsing failed"
)

type DefaultResponse struct {
	Message string `json:"message"`
}

func Authorized(ctx *fiber.Ctx) *user.User {
	if ctx.Get("Authorization") == "" {
		return nil
	}

	authArr := strings.Split(ctx.Get("Authorization"), " ")
	if len(authArr) != 2 {
		return nil
	}

	switch authArr[0] {
	case "Session": // in case a session id was used to identify
		dbUser, err := user.GetUser(authArr[1], user.UserSessionSearch)
		if err != nil {
			if err.Error() == user.UserNotFound {
				return nil
			} else {
				fmt.Println(err)
				return nil
			}
		}
		return dbUser
	default:
		return nil
	}
}