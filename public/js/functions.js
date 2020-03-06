function getTier(br) {
    let result = {};
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

function nom(attackBlob, target) {
    if (attackBlob.x < (target.x + 30) && attackBlob.x > (target.x - 30)) {
        if (attackBlob.y < (target.y + 30) && attackBlob.y > (target.y - 30)) {

            target.health -= Math.floor(Math.random() * 10) + 30;
            if (target.health <= 0) {
                socket.emit("singleplayerNomKey", { attackBlob, target }, "ffa");
                target.health = 100;
            }
        }
    }
}

function getTierByName(name) {
    switch (name) {
        case "bronze": return getTier(1000); break;
        case "silver": return getTier(2000); break;
        case "platinum": return getTier(4500); break;
        case "gold": return getTier(7000); break;
        case "diamond": return getTier(9500); break;
    }
}

function parseDistance(dist) {
    if (dist > 1000)
        return (dist / 1000).toFixed(2) + "K";
    else return (dist).toFixed(0);
}

/* levelsystem helper functions/constants */
const xpScale = 0.09;

function xpToLevel(xp) {
    return xpScale * Math.sqrt(xp);
}

function leveltoXP(level) {
    return (level / xpScale) ** 2;
}