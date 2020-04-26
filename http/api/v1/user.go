package v1

import (
	"fmt"

	"github.com/blobs-io/blobsgame/http/controller"
	"github.com/blobs-io/blobsgame/models/user"
	"github.com/gofiber/fiber"
)

type DailyGiftResponse struct {
	Bonus int `json:"bonus"`
}

func GetUser(ctx *fiber.Ctx) {
	target := ctx.Params("user")
	if target == "" {
		err := ctx.Status(400).JSON(controller.DefaultResponse{
			Message: user.UserNotFound,
		})
		if err != nil {
			fmt.Println(err)
		}
		return
	}

	if target == "@me" {
		requester := controller.Authorized(ctx)
		if requester == nil {
			err := ctx.Status(401).JSON(controller.DefaultResponse{
				Message: controller.Unauthorized,
			})
			if err != nil {
				fmt.Println(err)
			}
			return
		}
		err := ctx.JSON(requester.Expose(true))
		if err != nil {
			fmt.Println(err)
		}
		return
	} else {
		dbUser, err := user.GetUser(target, user.UserDefaultSearch)
		if err != nil || dbUser == nil {
			err := ctx.Status(404).JSON(controller.DefaultResponse{
				Message: controller.NotFound,
			})
			if err != nil {
				fmt.Println(err)
			}
			return
		}
		err = ctx.JSON(dbUser.Expose(false))
		if err != nil {
			fmt.Println(err)
		}
		return
	}

}

func RedeemDailyGift(ctx *fiber.Ctx) {
	requester := controller.Authorized(ctx)
	if requester == nil {
		err := ctx.Status(401).JSON(controller.DefaultResponse{
			Message: controller.Unauthorized,
		})
		if err != nil {
			fmt.Println(err)
		}
		return
	}

	err := requester.RedeemDailyGift()
	if err != nil {
		if err.Error() == user.DailyGiftFailed {
			err = ctx.Status(400).JSON(controller.DefaultResponse{
				Message: err.Error(),
			})
		} else {
			fmt.Println(err)
			err = ctx.Status(500).JSON(controller.DefaultResponse{
				Message: user.UnknownError,
			})
		}
		if err != nil {
			fmt.Println(err)
		}
		return
	}

	err = ctx.JSON(DailyGiftResponse{
		Bonus: user.DailyCoins,
	})
	if err != nil {
		fmt.Println(err)
	}
}
