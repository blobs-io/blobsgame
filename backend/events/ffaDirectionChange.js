class ffaDirectionChangeEvent {};

ffaDirectionChangeEvent.run = (...args) => {
    const [eventd, data, io, Base] = args;
    const target = Base.gamemodes.ffa.players[Base.gamemodes.ffa.players.findIndex(v => v.owner === eventd.owner)];
    if (target === undefined) return;
    target._directionChange = Date.now();
};

module.exports = ffaDirectionChangeEvent;
