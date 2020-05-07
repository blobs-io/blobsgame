package utils

import (
	"errors"
	"fmt"
	"github.com/blobs-io/blobsgame/database"
	"time"
)

const (
	BronzeBR = 0
	BronzeColorCode = 0xb57156

	SilverBR = 2000
	SilverColorCode = 0xdbdbdb

	PlatinumBR = 4000
	PlatinumColorCode = 0xe5e4e2

	GoldBR = 6000
	GoldColorCode = 0xd7af00

	DiamondBR = 9000
	DiamondColorCode = 0x16f7ef

	PromotionLimit = 50
	PromotionLimitErrorMessage = "promotion limit exceeded"

	// Time to live in minutes
	PromotionTLL = 1440
)

type Tier struct {
	Name string `json:"name"`
	ColorCode int `json:"colorCode"`
	EmblemFile string `json:"emblemFile"`
}

type Promotion struct {
	Drop bool `json:"drop"`
	NewTier Tier `json:"newTier"`
}

type FullPromotion struct {
	User string `json:"user"`
	NewTier string `json:"newTier"`
	Drop bool `json:"drop"`
	PromotedAt int64 `json:"promotedAt"`
}

func GetTier(br int) Tier {
	if br >= BronzeBR && br < SilverBR {
		return Tier {
			Name: "bronze",
			ColorCode: BronzeColorCode,
			EmblemFile: "emblem_bronze.png",
		}
	} else if br >= SilverBR && br < PlatinumBR {
		return Tier {
			Name: "silver",
			ColorCode: SilverColorCode,
			EmblemFile: "emblem_silver.png",
		}
	} else if br >= PlatinumBR && br < GoldBR {
		return Tier {
			Name: "platinum",
			ColorCode: PlatinumColorCode,
			EmblemFile: "emblem_platinum.png",
		}
	} else if br >= GoldBR && br < DiamondBR {
		return Tier {
			Name: "gold",
			ColorCode: GoldColorCode,
			EmblemFile: "emblem_gold.png",
		}
	} else if br >= DiamondBR {
		return Tier {
			Name: "diamond",
			ColorCode: DiamondColorCode,
			EmblemFile: "emblem_diamond.png",
		}
	} else {
		return Tier {}
	}
}

func PromotedTo(oldBR int, newBR int) Promotion {
	if oldBR >= SilverBR && newBR < SilverBR {
		// silver -> bronze
		return Promotion { true, GetTier(BronzeBR) }
	} else if oldBR < SilverBR && newBR >= SilverBR {
		// bronze -> silver
		return Promotion { false, GetTier(SilverBR) }
	} else if oldBR >= PlatinumBR && newBR < PlatinumBR {
		// platinum -> silver
		return Promotion { true, GetTier(SilverBR) }
	} else if oldBR < PlatinumBR && newBR >= PlatinumBR {
		// silver -> platinum
		return Promotion { false, GetTier(PlatinumBR) }
	} else if oldBR >= GoldBR && newBR < GoldBR {
		// gold -> platinum
		return Promotion { true, GetTier(PlatinumBR) }
	} else if oldBR < GoldBR && newBR >= GoldBR {
		// platinum -> gold
		return Promotion { false, GetTier(GoldBR) }
	} else if oldBR >= DiamondBR && newBR < DiamondBR {
		// diamond -> gold
		return Promotion { true, GetTier(GoldBR) }
	} else if oldBR < DiamondBR && newBR >= DiamondBR {
		// gold -> diamond
		return Promotion { false, GetTier(DiamondBR) }
	}

	return Promotion{}
}

func GetRecentPromotions(limit int) ([]FullPromotion, error) {
	if limit < 0 || limit > PromotionLimit {
		return nil, errors.New(PromotionLimitErrorMessage)
	}

	rows, err := database.Database.Query(`SELECT "user", "newTier", "drop", "promotedAt" FROM recentpromotions LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	promotions := make([]FullPromotion, 0)
	for rows.Next() {
		var p FullPromotion
		rows.Scan(&p.User, &p.NewTier, &p.Drop, &p.PromotedAt)
		promotions = append(promotions, p)
	}

	return promotions, nil
}

func CheckDeletePromotion(p FullPromotion) bool {
	if (time.Now().UnixNano() / int64(time.Millisecond) - p.PromotedAt) / 1000 / 60 < PromotionTLL {
		return false
	}

	rows, err := database.Database.Query(`DELETE FROM recentpromotions WHERE "user" = $1 AND "newTier" = $2`, p.User, p.NewTier)
	if err != nil {
		fmt.Println(err)
		return false
	}
	defer rows.Close()
	return true
}

func CheckDeleteAllPromotions(promotions []FullPromotion) {
	for _, p := range promotions {
		CheckDeletePromotion(p)
	}
}