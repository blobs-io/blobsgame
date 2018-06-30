class disconnectEvent { };

/**
 * Runs the disconnect event.
 * 
 * @param {Array} args Method arguments (sockets, data)
 * @returns {Array} The sockets array
 */
disconnectEvent.run = (...args) => {
    const [sockets, data] = args;
    if(sockets.find(val => val.socketid === data.id)){
        sockets.splice(sockets.findIndex(val => val.socketid === data.id), sockets.findIndex(val => val.socketid === data.id));
    }
    return sockets;
};

module.exports = disconnectEvent;