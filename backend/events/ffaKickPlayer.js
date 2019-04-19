class ffaKickPlayerEvent {}

ffaKickPlayerEvent.run = async (...args) => {
    const [eventd, data, io, Base, gameid] = args;
    const room = Base.rooms.find(v => v.id === gameid);
    if (!room) return;
    const requester = room.players.find(v => v.id === data.id);
    if (!requester) return;
    if (requester.role !== 1) {
        io.to(data.id).emit("ffaKick", "Insufficient permissions.");
        return data.disconnect();
    } else {
        const target = room.players.find(v => v.owner === eventd.user);
        if (target && typeof eventd.reason === "string") {
            if (eventd.reason.length > 0 && eventd.reason.length < 128) {
                io.to(target.id).emit("ffaKick", eventd.reason);
                io.sockets.sockets[target.id].disconnect();
            }
        }
    }
};

module.exports = ffaKickPlayerEvent;
