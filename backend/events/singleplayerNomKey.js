class ffaNomKey {};
const {
    execSync
} = require("child_process");

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

function promotedTo(oldbr, newbr) {
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

ffaNomKey.run = async (data, io, Base, sqlite, eventd) => {
    const { attackBlob, target } = eventd;
    if (!attackBlob || !target) return;
    if (isNaN(attackBlob.br) || isNaN(target.br)) return;
    if (Math.abs(attackBlob.br - target.br) > 501) return;


    if (attackBlob.br === target.br) attackBlob.br -= 1;
    let result = parseInt(execSync(Base.algorith.replace(/\{ownbr\}/g, attackBlob.br).replace(/\{opponentbr\}/g, target.br)));
    if (result === 0) ++result;
    attackBlob.br = (attackBlob.br + result > 9999 ? 9999 : attackBlob.br + result);
    target.br = (target.br - result <= 0 ? 1 : target.br - result);

    await sqlite.prepare("UPDATE accounts SET br=? WHERE username=?").then(v => v.run([(target.br - result <= 0 ? 1 : target.br), target.owner]));
    await sqlite.prepare("UPDATE accounts SET br=? WHERE username=?").then(v => v.run([(attackBlob.br + result > 9999 ? 9999 : attackBlob.br), attackBlob.owner]));

    target.directionChangeCoordinates.x = Math.floor(Math.random() * 2000);
    target.directionChangedAt = Date.now();

    io.to(data.id).emit("ffaPlayerNommed", {
        winner: attackBlob,
        loser: target,
        result: typeof result !== "undefined" ? result : 0
    });
};

module.exports = ffaNomKey;
