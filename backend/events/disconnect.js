class disconnectEvent {};

/**
 * Runs the disconnect event.
 * 
 * @param {Array} args Method arguments (sockets, data)
 * @returns {Array} The sockets array
 */
disconnectEvent.run = (...args) => {
    const [data, Base, io] = args;
    if (Base.rooms.find(v => v.id === "ffa").players.some(v => v.id === data.id)) {
        io.sockets.emit("ffaPlayerDelete", Object.assign(Base.rooms.find(v => v.id === "ffa").players.find(v => v.id === data.id).owner), {id: undefined});
        let user = Base.rooms.find(v => v.id === "ffa").players.find(v => v.id === data.id);
        if (user.guest !== true) Base.sqlite.prepare("UPDATE accounts SET distance = distance + ? WHERE username=?").then(prep => prep.run([user.distance / 1000, user.owner]));
        Base.rooms[Base.rooms.findIndex(v => v.id === "ffa")].players.splice(Base.rooms.find(v => v.id === "ffa").players.findIndex(v => v.id === data.id), 1);
    }
    if (Base.sockets.find(val => val.socketid === data.id)) {
        Base.sockets[Base.sockets.findIndex(val => val.socketid === data.id)].inactiveSince = Date.now();
    }
    return {
        sockets: Base.sockets,
        players: Base.rooms.find(v => v.id === "ffa").players
    };
};

module.exports = disconnectEvent;
