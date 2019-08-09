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
    if (br >= 0 && br < 1500) {
        result.tier = "bronze";
        result.colorCode = "b57156";
        result.emblemFile = "emblem_bronze.png";
    } else if (br >= 1500 && br < 3000) {
        result.tier = "silver";
        result.colorCode = "dbdbdb";
        result.emblemFile = "emblem_silver.png";
    } else if (br >= 3000 && br < 5000) {
        result.tier = "platinum";
        result.colorCode = "E5E4E2";
        result.emblemFile = "emblem_platinum.png";
    } else if (br >= 5000 && br < 8000) {
        result.tier = "gold";
        result.colorCode = "D7AF00";
        result.emblemFile = "emblem_gold.png";
    } else if (br >= 8000 && br < 9500) {
        result.tier = "diamond";
        result.colorCode = "16f7ef";
        result.emblemFile = "emblem_diamond.png";
    } else if (br >= 9500 && br < 10000) {
        result.tier = "painite";
        result.colorCode = "16f77f";
        result.emblemFile = "emblem_painite.png";
    }
    return result;
}

export function promotedTo(oldbr: number, newbr: number): Promotion | void {
    if (oldbr >= 1500 && newbr < 1500) return {
        drop: true,
        newTier: "bronze"
    };
    if (oldbr < 1500 && newbr >= 1500) return {
        drop: false,
        newTier: "silver"
    };
    if (oldbr >= 3000 && newbr < 3000) return {
        drop: true,
        newTier: "silver"
    };
    if (oldbr < 3000 && newbr >= 3000) return {
        drop: false,
        newTier: "platinum"
    };
    if (oldbr >= 5000 && newbr < 5000) return {
        drop: true,
        newTier: "platinum"
    };
    if (oldbr < 5000 && newbr >= 5000) return {
        drop: false,
        newTier: "gold"
    };
    if (oldbr >= 8000 && newbr < 8000) return {
        drop: true,
        newTier: "gold"
    };
    if (oldbr < 8000 && newbr >= 8000) return {
        drop: false,
        newTier: "diamond"
    };
    if (oldbr >= 9500 && newbr < 9500) return {
        drop: true,
        newTier: "diamond"
    };
    if (oldbr < 9500 && newbr >= 9500) return {
        drop: false,
        newTier: "painite"
    };
    return undefined;
}