class ffaNomKey { };
const {
    execSync
} = require("child_process");


ffaNomKey.run = async(data, io, Base, sqlite) => {
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


                    let won = Base.gamemodes.ffa.players.find(v => v.owner === eventd.owner)._directionChange > blobobj._directionChange;
                    let winner = !won ? blobobj : Base.gamemodes.ffa.players.find(v => v.owner === eventd.owner);
                    let loser = won ? blobobj : Base.gamemodes.ffa.players.find(v => v.owner === eventd.owner);

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
