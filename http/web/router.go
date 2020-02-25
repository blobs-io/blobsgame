package web

import (
	"fmt"
	"github.com/gofiber/fiber"
)

var App *fiber.App

const (
	HomeRoute = "/"
	LoginRoute = "/login"
	RegisterRoute = "/register"
	AppRoute = "/app"
	GameRoute = "/game"
)

func Init(port int) {
	App = fiber.New(&fiber.Settings {
		MaxRequestBodySize: 1024 * 500,
	})

	App.Get("/", func(ctx *fiber.Ctx) {
		ctx.Redirect("/login")
	})
	App.Static("/api/v1/docs", "./public/api/docs")
	App.Static("/app", "./public/app")
	App.Static("/login", "./public/login")
	App.Static("/assets", "./public/assets")
	App.Static("/clans", "./public/clans")
	App.Static("/css", "./public/css")
	App.Static("/game", "./public/game")
	App.Static("/js", "./public/js")
	App.Static("/register", "./public/register")
	App.Static("/sources", "./public/sources")
	App.Static("/verify", "./public/verify")

	fmt.Printf("Webserver listening on port %d\n", port)
	err := App.Listen(port)
	if err != nil {
		fmt.Println(err)
	}
}