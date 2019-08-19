export interface Tier {
    tier?: string;
    colorCode?: string;
    emblemFile?: string;
}

export interface Promotion {
    drop: boolean;
    newTier: string;
}

export function getTier(br: number): Tier {
    let result: Tier = {};
    if (br >= 0 && br < 2000) {
        result.tier = "bronze";
        result.colorCode = "b57156";
        result.emblemFile = "emblem_bronze.png";
    } else if (br >= 2000 && br < 4000) {
        result.tier = "silver";
        result.colorCode = "dbdbdb";
        result.emblemFile = "emblem_silver.png";
    } else if (br >= 4000 && br < 6000) {
        result.tier = "platinum";
        result.colorCode = "E5E4E2";
        result.emblemFile = "emblem_platinum.png";
    } else if (br >= 6000 && br < 9000) {
        result.tier = "gold";
        result.colorCode = "D7AF00";
        result.emblemFile = "emblem_gold.png";
    } else if (br >= 9000) {
        result.tier = "diamond";
        result.colorCode = "16f7ef";
        result.emblemFile = "emblem_diamond.png";
    }
    return result;
}

export function promotedTo(oldbr: number, newbr: number): Promotion | void {
    if (oldbr >= 2000 && newbr < 2000) return {
        drop: true,
        newTier: "bronze"
    };
    if (oldbr < 2000 && newbr >= 2000) return {
        drop: false,
        newTier: "silver"
    };
    if (oldbr >= 4000 && newbr < 4000) return {
        drop: true,
        newTier: "silver"
    };
    if (oldbr < 4000 && newbr >= 4000) return {
        drop: false,
        newTier: "platinum"
    };
    if (oldbr >= 6000 && newbr < 6000) return {
        drop: true,
        newTier: "platinum"
    };
    if (oldbr < 6000 && newbr >= 6000) return {
        drop: false,
        newTier: "gold"
    };
    if (oldbr >= 9000 && newbr < 9000) return {
        drop: true,
        newTier: "gold"
    };
    if (oldbr < 9000 && newbr >= 9000) return {
        drop: false,
        newTier: "diamond"
    };
    return undefined;
}