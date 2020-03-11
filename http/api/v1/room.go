package v1

import (
	"fmt"
	"github.com/blobs-io/blobsgame/http/controller"
	"github.com/blobs-io/blobsgame/models/room"
	"github.com/gofiber/fiber"
)

func GetPlayers(ctx *fiber.Ctx) {
	r, ok := room.Rooms[ctx.Params("id")]
	if !ok {
		err := ctx.Status(404).JSON(controller.DefaultResponse {
			Message: controller.NotFound,
		})
		if err != nil {
			fmt.Println(err)
		}
		return
	}
	err := ctx.JSON(r.Players)
	if err != nil {
		fmt.Println(err)
	}
}

func GetRoom(ctx *fiber.Ctx) {
	r, ok := room.Rooms[ctx.Params("id")]
	if !ok {
		err := ctx.Status(404).JSON(controller.DefaultResponse {
			Message: controller.NotFound,
		})
		if err != nil {
			fmt.Println(err)
		}
		return
	}
	err := ctx.JSON(r)
	if err != nil {
		fmt.Println(err)
	}
}

func GetRooms(ctx *fiber.Ctx) {
	err := ctx.JSON(room.Rooms)
	if err != nil {
		fmt.Println(err)
	}
}