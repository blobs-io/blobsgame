package routes

import (
	"fmt"
	"github.com/blobs-io/blobsgame/models/user"
	"github.com/gofiber/fiber"
	"strconv"
	"time"
)

type LoginRequestBody struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func Login(ctx *fiber.Ctx) {
	var body LoginRequestBody
	err := ctx.BodyParser(&body)
	if err != nil {
		fmt.Println(err)
		return
	}
	if body.Username == "" || body.Password == "" {
		ctx.Status(401).Write("invalid username or password")
		return
	}

	sess, err := user.Login(body.Username, body.Password)
	if err != nil {
		ctx.Status(400).Write(err.Error())
		return
	}

	cookie := new(fiber.Cookie)
	sessInt, err := strconv.ParseInt(sess.Expires, 10, 64)
	if err != nil {
		fmt.Println(err)
		ctx.Status(500).Write("an unknown error occurred")
		return
	}
	cookie.Name = "session"
	cookie.Value = sess.SessionID
	cookie.Expires = time.Unix(sessInt / 1000, 0)
	ctx.Cookie(cookie)

	ctx.Redirect("/app")
}