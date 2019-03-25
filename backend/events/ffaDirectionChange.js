class ffaDirectionChangeEvent {}

ffaDirectionChangeEvent.run = (...args) => {
    const [eventd, data, io, Base] = args;
    const target = Base.rooms.find(v => v.id === "ffa").players[Base.rooms.find(v => v.id === "ffa").players.findIndex(v => v.owner === eventd.owner)];
    if (target === undefined) return;
    if (typeof target.x !== "number" || typeof target.y !== "number") return;
    target.directionChangedAt = Date.now() - eventd.directionChangedAt < 5000 ? eventd.directionChangedAt : Date.now();
    target.direction = eventd._direction;
    target.distance += Math.abs(target.directionChangeCoordinates.x - target.x) + Math.abs(target.directionChangeCoordinates.y - target.y);
    target.directionChangeCoordinates = {
		x: eventd.directionChangeCoordinates.x,
		y: eventd.directionChangeCoordinates.y
    };
    io.sockets.emit("ffaDirectionChanged", Object.assign(JSON.parse(JSON.stringify(target)), { x: target.x, y: target.y }));
};

module.exports = ffaDirectionChangeEvent;
