package v1

import (
	"github.com/blobs-io/blobsgame/http/controller"
	"github.com/blobs-io/blobsgame/models/user"
	"github.com/blobs-io/blobsgame/utils"
	"github.com/gofiber/fiber"
)

func Ping(ctx *fiber.Ctx) {
	ctx.Status(204).Write()
}

func Promotions(ctx *fiber.Ctx) {
	promotions, err := utils.GetRecentPromotions(50)
	if err != nil {
		ctx.Status(500).JSON(controller.DefaultResponse{
			Message: user.UnknownError,
		})
		return
	}
	
	go utils.CheckDeleteAllPromotions(promotions)

	ctx.JSON(promotions)
}