class ffaPlayerCreateEvent {};

ffaPlayerCreateEvent.run = (...args) => {
    const [blob, io, Base, data] = args;
    if (typeof blob === "undefined") return;
    if (blob === null) return;
    if (blob.constructor.name !== "Object") return;
    if (!blob.owner || !blob.br || !blob.x || !blob.y || !blob.img) return io.to(data.id).emit("ffaLoginFailed", "Properties must not have null as value.");
    if (Base.gamemodes.ffa.players.find(v => v.owner === blob.owner)) return io.to(data.id).emit("ffaLoginFailed", "Username is already taken.");
    if (typeof blob.x !== "number" || typeof blob.y !== "number") return;
    blob.id = data.id;
    blob.lastnom = Date.now();
    blob._directionChange = Date.now();

    Base.gamemodes.ffa.players.push(blob);
    io.to(data.id).emit("ffaObjectsHeartbeat", Base.gamemodes.ffa.objects);
};

module.exports = ffaPlayerCreateEvent;
