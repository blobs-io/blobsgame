package v1

import (
	"fmt"
	"github.com/blobs-io/blobsgame/http/controller"
	"github.com/blobs-io/blobsgame/models/user"
	"github.com/gofiber/fiber"
)

type requestBody struct {
	NewBlob string `json:"newBlob"`
}

func SwitchBlob(ctx *fiber.Ctx) {
	var body requestBody
	err := ctx.BodyParser(&body)
	if err != nil {
		err = ctx.Status(400).JSON(controller.DefaultResponse {
			Message: controller.BodyParseFailure,
		})
		if err != nil {
			fmt.Println(err)
		}
		return
	}

	if body.NewBlob == "" {
		err = ctx.Status(400).JSON(controller.DefaultResponse {
			Message: user.BlobNoAccess,
		})
		if err != nil {
			fmt.Println(err)
		}
		return
	}

	requester := controller.Authorized(ctx)
	if requester == nil {
		err := ctx.Status(401).JSON(controller.DefaultResponse {
			Message: controller.Unauthorized,
		})
		if err != nil {
			fmt.Println(err)
		}
		return
	}

	err = requester.SwitchBlob(body.NewBlob)
	if err != nil {
		if err.Error() == user.BlobNoAccess {
			err = ctx.Status(400).JSON(controller.DefaultResponse {
				Message: user.BlobNoAccess,
			})
		} else {
			fmt.Println(err)
			err = ctx.Status(500).JSON(controller.DefaultResponse {
				Message: user.UnknownError,
			})
		}
		if err != nil {
			fmt.Println(err)
		}
	}
}