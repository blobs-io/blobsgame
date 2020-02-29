package routes

import (
	"fmt"
	"github.com/blobs-io/blobsgame/models/user"
	"github.com/gofiber/fiber"
)

type RegisterRequestBody struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func Register(ctx *fiber.Ctx) {
	var body RegisterRequestBody
	err := ctx.BodyParser(&body)
	if err != nil {
		fmt.Println(err)
		return
	}

	err = user.Register(body.Username, body.Password)
	if err != nil {
		fmt.Println(err)
		ctx.Status(500).Write("Account creation failed. " + err.Error())
		return
	}

	// Successfully registered
}