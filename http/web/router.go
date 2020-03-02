package web

import (
	"fmt"
	v1 "github.com/blobs-io/blobsgame/http/api/v1"
	"github.com/blobs-io/blobsgame/http/web/routes"
	"github.com/gofiber/fiber"
)

var App *fiber.App

func Init(port int) {
	App = fiber.New()

	// Main routes
	App.Get("/", func(ctx *fiber.Ctx) {
		ctx.Redirect("/login")
	})
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

	App.Post("/login", routes.Login)
	App.Post("/register", routes.Register)

	// API
	App.Get("/api/v1/users/:user", v1.GetUser)

	fmt.Printf("Webserver listening on port %d\n", port)
	err := App.Listen(port)
	if err != nil {
		fmt.Println(err)
	}
}