class ffaCoordinateChangeEvent {};
const {
    execSync
} = require("child_process");

ffaCoordinateChangeEvent.run = async (...args) => {
    const [eventd, data, io, Base, sqlite] = args;
    eventd.id = data.id;
    if (parseInt(eventd.x) === NaN || parseInt(eventd.y) === NaN || parseInt(eventd.br) === NaN) return;
    try {
        let prev = Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === eventd.owner)];
        eventd.lastnom = prev.lastnom;
        eventd._directionChange = prev._directionChange;
        eventd.role = prev.role;
    } catch (e) {}
    Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === eventd.owner)] = eventd;
}

module.exports = ffaCoordinateChangeEvent;
