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

ffaNomKey.run = async (data, io, Base, sqlite) => {
    const eventd = Base.gamemodes.ffa.players.find(v => v.id === data.id);
    if (!eventd) return;
    if (parseInt(eventd.x) === NaN || parseInt(eventd.y) === NaN || parseInt(eventd.br) === NaN) return;

    for (const blobobj of Base.gamemodes.ffa.players) {
        if (eventd.owner !== blobobj.owner) {
            if (eventd.x < (blobobj.x + 30) && eventd.x > (blobobj.x - 30)) {
                if (eventd.y < (blobobj.y + 30) && eventd.y > (blobobj.y - 30)) {
                    if (eventd.guest === true || blobobj.guest === true) return;
                    if (Date.now() - eventd.lastnom < 1500) return; // Nom cooldown (1.5 seconds)
                    // If blob is nommed
                    Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.id === data.id)].lastnom = Date.now();


                    let winner = eventd;
                    let loser = blobobj;

                    if (eventd.br === blobobj.br) eventd.br -= 1;
                    if (parseInt(blobobj.br) !== NaN) {
                        let result = parseInt(execSync(Base.algorith.replace(/\{ownbr\}/g, eventd.br).replace(/\{opponentbr\}/g, blobobj.br)));
                        if (result === 0) ++result;
                        Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === winner.owner)].br = (winner.br + result > 9999 ? 9999 : winner.br + result);
                        Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === loser.owner)].x = Math.floor(Math.random() * 150) + 150;
                        Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === loser.owner)].y = Math.floor(Math.random() * 150) + 150;
                        Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === loser.owner)].br = (loser.br - result <= 0 ? 1 : loser.br - result);

                        loser.br = Base.gamemodes.ffa.players.find(v => v.owner === loser.owner).br;
                        winner.br = Base.gamemodes.ffa.players.find(v => v.owner === winner.owner).br;

                        await sqlite.prepare("UPDATE accounts SET br=? WHERE username=?").then(v => v.run([(loser.br - result <= 0 ? 1 : loser.br - result), loser.owner]));
                        await sqlite.prepare("UPDATE accounts SET br=? WHERE username=?").then(v => v.run([(winner.br + result > 9999 ? 9999 : winner.br + result), winner.owner]));

                        const dropRes = {
                            winner: promotedTo(winner.br - result, winner.br) || {
                                drop: undefined
                            },
                            loser: promotedTo(loser.br + result, loser.br) || {
                                drop: undefined
                            }
                        };
                        if (typeof dropRes.winner.drop !== "undefined") {
                            sqlite.prepare("INSERT INTO recentPromotions VALUES (?, ?, ?, ?)").then(prepared => {
                                prepared.run([winner.owner, dropRes.winner.newTier, dropRes.winner.drop, Date.now()]);
                            });
                        } else if (typeof dropRes.loser.drop !== "undefined") {
                            sqlite.prepare("INSERT INTO recentPromotions VALUES (?, ?, ?, ?)").then(prepared => {
                                prepared.run([loser.owner, dropRes.loser.newTier, dropRes.loser.drop, Date.now()]);
                            });
                        }


                        io.sockets.emit("ffaPlayerNommed", {
                            winner,
                            loser,
                            result
                        });
                    }

                }
            }
        }
    }
};

module.exports = ffaNomKey;
