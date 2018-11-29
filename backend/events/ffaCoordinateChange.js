class ffaCoordinateChangeEvent {};

ffaCoordinateChangeEvent.run = async (...args) => {
    const [eventd, data, io, Base, sqlite] = args;
    eventd.id = data.id;
    if (parseInt(eventd.x) === NaN || parseInt(eventd.y) === NaN || parseInt(eventd.br) === NaN) return;
    try {
        let prev = Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === eventd.owner)];
        eventd.lastnom = prev.lastnom;
        eventd._directionChange = prev._directionChange;
        eventd.role = prev.role;
        if (eventd.x < 0) eventd.x = 0;
        if (eventd.y < 0) eventd.y = 0;
        if (eventd.x > 2000) eventd.x = 2000;
        if (eventd.y > 2000) eventd.y = 2000;
    } catch (e) {}
    Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === eventd.owner)] = eventd;
};

module.exports = ffaCoordinateChangeEvent;
