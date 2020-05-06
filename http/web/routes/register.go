package routes

import (
	"fmt"
	"github.com/blobs-io/blobsgame/models/user"
	"github.com/blobs-io/blobsgame/utils"
	"github.com/gofiber/fiber"
)

type RegisterRequestBody struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Token string `json:"token"`
}

func Register(ctx *fiber.Ctx) {
	var body RegisterRequestBody
	err := ctx.BodyParser(&body)
	if err != nil {
		fmt.Println(err)
		return
	}

	captchaResp, err := utils.RateCaptcha(body.Token)
	if err != nil {
		fmt.Println(err)
		ctx.Status(500).Write("Account creation failed. " + err.Error())
		return
	}

	if !utils.ValidateCaptcha(captchaResp) {
		ctx.Status(403).Write("Invalid captcha")
		return
	}

	err = user.Register(body.Username, body.Password)
	if err != nil {
		fmt.Println(err)
		ctx.Status(500).Write("Account creation failed. " + err.Error())
		return
	}

	// Successfully registered
	ctx.Redirect("/login")
}