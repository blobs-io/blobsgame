package v1

import (
	"github.com/gofiber/fiber"
)

func Ping(ctx *fiber.Ctx) {
	ctx.Status(204).Write()
}