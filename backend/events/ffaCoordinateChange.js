class ffaCoordinateChangeEvent {};
const {
    execSync
} = require("child_process");

ffaCoordinateChangeEvent.run = (...args) => {
    const [eventd, data, io, Base] = args;
    // TODO: checks...
    eventd.id = data.id;

    if (parseInt(eventd.x) === NaN || parseInt(eventd.y) === NaN || parseInt(eventd.br) === NaN) return;

    for (const blobobj of Base.gamemodes.ffa.players) {
        if (eventd.owner !== blobobj.owner) {
            if (eventd.x < (blobobj.x + 30) && eventd.x > (blobobj.x - 30)) {
                if (eventd.y < (blobobj.y + 30) && eventd.y > (blobobj.y - 30) && Date.now() && (Date.now() - blobobj.lastnom > 1500)) {
                    blobobj.lastnom = Date.now();
                    // If blob is nommed


                    let won = Base.gamemodes.ffa.players.find(v => v.owner === eventd.owner)._directionChange > blobobj._directionChange;
                    let winner = !won ? blobobj : Base.gamemodes.ffa.players.find(v => v.owner === eventd.owner);
                    let loser = won ? blobobj : Base.gamemodes.ffa.players.find(v => v.owner === eventd.owner);



                    if (parseInt(blobobj.br) !== NaN) {
                        let result = parseInt(execSync(Base.algorith.replace(/\{ownbr\}/g, eventd.br).replace(/\{opponentbr\}/g, blobobj.br)));
                        if (result === 0) ++result;
                        Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === winner.owner)].br += result;
                        Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === loser.owner)].x = Math.floor(Math.random() * 150) + 150;
                        Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === loser.owner)].y = Math.floor(Math.random() * 150) + 150;
                        Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === loser.owner)].br -= result;
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
    try {
        let prev = Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === eventd.owner)]
        eventd.lastnom = prev.lastnom;
        eventd._directionChange = prev._directionChange;
    } catch (e) {}
    Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === eventd.owner)] = eventd;
}

module.exports = ffaCoordinateChangeEvent;
