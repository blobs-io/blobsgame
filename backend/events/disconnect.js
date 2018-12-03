class disconnectEvent {};

/**
 * Runs the disconnect event.
 * 
 * @param {Array} args Method arguments (sockets, data)
 * @returns {Array} The sockets array
 */
disconnectEvent.run = (...args) => {
    const [data, Base, io] = args;
    if (Base.gamemodes.ffa.players.some(v => v.id === data.id)) {
        io.sockets.emit("ffaPlayerDelete", Base.gamemodes.ffa.players.find(v => v.id === data.id).owner);
        Base.gamemodes.ffa.players.splice(Base.gamemodes.ffa.players.findIndex(v => v.id === data.id), 1);
    }
    if (Base.sockets.find(val => val.socketid === data.id)) {
        Base.sockets[Base.sockets.findIndex(val => val.socketid === data.id)].inactiveSince = Date.now();
    }
    return {
        sockets: Base.sockets,
        players: Base.gamemodes.ffa.players
    };
};

module.exports = disconnectEvent;
