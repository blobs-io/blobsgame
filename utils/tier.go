package utils

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