function getTier(br) {
    let result = {};
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
        case "platinum": return getTier(3500); break;
        case "gold": return getTier(5500); break;
        case "diamond": return getTier(8500); break;
        case "painite": return getTier(9999); break;
    }
}