class ffaDirectionChangeEvent {};

ffaDirectionChangeEvent.run = (...args) => {
    const [eventd, data, io, Base] = args;
    const target = Base.rooms.find(v => v.id === "ffa").players[Base.rooms.find(v => v.id === "ffa").players.findIndex(v => v.owner === eventd.owner)];
    if (target === undefined) return;
    target._directionChange = Date.now();
};

module.exports = ffaDirectionChangeEvent;
