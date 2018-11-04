class ffaPlayerCreateEvent {};

ffaPlayerCreateEvent.run = async (...args) => {
    const [blob, io, Base, data, sockets] = args;
    const socket = sockets.find(v => v.sessionid === blob);
    if (!socket) return io.to(data.id).emit("ffaUnauthorized");
    const nblob = {};
    nblob.x = Math.floor(Math.random() * 600);
    nblob.y = Math.floor(Math.random() * 600);
    nblob.owner = socket.username;
    nblob.direction = 0;
    nblob.br = socket.br;
    nblob.id = data.id;
    nblob.lastnom = Date.now();
    nblob._directionChange = Date.now();

    Base.gamemodes.ffa.players.push(nblob);
    io.to(data).emit("ffaObjectsHeartbeat", Base.gamemodes.ffa.objects);
    io.to(data.id).emit("ffaHeartbeat", {
		username: socket.username,
		br: socket.br
	});
};

module.exports = ffaPlayerCreateEvent;
