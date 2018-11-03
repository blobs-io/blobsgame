class disconnectEvent {};

/**
 * Runs the disconnect event.
 * 
 * @param {Array} args Method arguments (sockets, data)
 * @returns {Array} The sockets array
 */
disconnectEvent.run = (...args) => {
    const [sockets, data, Base, io] = args;
    if (Base.gamemodes.ffa.players.some(v => v.id === data.id)) {
        io.sockets.emit("ffaPlayerDelete", Base.gamemodes.ffa.players.find(v => v.id === data.id).owner);
        Base.gamemodes.ffa.players.splice(Base.gamemodes.ffa.players.findIndex(v => v.id === data.id), 1);
    }
    if (sockets.find(val => val.socketid === data.id)) {
        sockets.splice(sockets.findIndex(val => val.socketid === data.id), sockets.findIndex(val => val.socketid === data.id));
    }
    return {
        sockets,
        players: Base.gamemodes.ffa.players
    };
};

module.exports = disconnectEvent;
