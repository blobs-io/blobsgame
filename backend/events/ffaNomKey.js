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
    const eventd = Base.rooms[Base.rooms.findIndex(v => v.id === "ffa")].players.find(v => v.id === data.id);
    if (!eventd) return;
    if (isNaN(eventd.x) || isNaN(eventd.y) || isNaN(eventd.br)) return;
    for (const blobobj of Base.rooms.find(v => v.id === "ffa").players) {
        if (eventd.owner !== blobobj.owner) {
            if (eventd.inProtectedArea === false) {
                if (eventd.x < (blobobj.x + 30) && eventd.x > (blobobj.x - 30)) {
                    if (eventd.y < (blobobj.y + 30) && eventd.y > (blobobj.y - 30)) {
                        const hasGuest = eventd.guest === true || blobobj.guest === true;
                        if (Date.now() - eventd.lastnom < 1500) return; // Nom cooldown (1.5 seconds)
                        // If blob is nommed
						
					    blobobj.health -= Math.floor(Math.random() * 10) + 30;
						if (blobobj.health > 0) {
							io.sockets.emit("ffaHealthUpdate", {
							    health: blobobj.health,
                                user: blobobj.owner
                            });
							break;
						} else {
                            blobobj.health = 100;
                        }


                        Base.rooms[Base.rooms.findIndex(v => v.id === "ffa")].players[Base.rooms[Base.rooms.findIndex(v => v.id === "ffa")].players.findIndex(v => v.id === data.id)].lastnom = Date.now();


                        let winner = Base.rooms.find(v => v.id === "ffa").players[Base.rooms.find(v => v.id === "ffa").players.findIndex(v => v.owner === eventd.owner)];
                        let loser = Base.rooms.find(v => v.id === "ffa").players[Base.rooms.find(v => v.id === "ffa").players.findIndex(v => v.owner === blobobj.owner)];

						let result = undefined;
                        if (!isNaN(blobobj.br) && !hasGuest) {
                            if (eventd.br === blobobj.br) eventd.br -= 1;
                            result = parseInt(execSync(Base.algorithm.replace(/\{ownbr\}/g, eventd.br).replace(/\{opponentbr\}/g, blobobj.br)));
                            if (result === 0) ++result;
                            winner.br = (winner.br + result > 9999 ? 9999 : winner.br + result);
                            loser.br = (loser.br - result <= 0 ? 1 : loser.br - result);

                            await sqlite.prepare("UPDATE accounts SET br=? WHERE username=?").then(v => v.run([(loser.br - result <= 0 ? 1 : loser.br), loser.owner]));
                            await sqlite.prepare("UPDATE accounts SET br=? WHERE username=?").then(v => v.run([(winner.br + result > 9999 ? 9999 : winner.br), winner.owner]));
                            await sqlite.prepare("UPDATE accounts SET wins = wins + 1 WHERE username=?").then(v => v.run([winner.owner]));
                            await sqlite.prepare("UPDATE accounts SET losses = losses + 1 WHERE username=?").then(v => v.run([loser.owner]));

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
                        }

                        loser.directionChangeCoordinates.x = Math.floor(Math.random() * 2000);
                        loser.directionChangeCoordinates.y = Math.floor(Math.random() * 2000);
                        loser.directionChangedAt = Date.now();

                        io.sockets.emit("ffaPlayerNommed", {
                            winner,
                            loser,
                            result: typeof result !== undefined ? result : 0
                        });

                    }
                }
            }
        }
    }
};

module.exports = ffaNomKey;
