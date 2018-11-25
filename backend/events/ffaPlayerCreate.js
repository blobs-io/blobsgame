class ffaPlayerCreateEvent {};

ffaPlayerCreateEvent.run = async (...args) => {
    const [blob, io, Base, data, sockets] = args;
    let socket = sockets.find(v => v.sessionid === blob);
    if (!socket) {
        let guestID = Math.floor((Math.random() * 999) + 1).toString();
        while(sockets.some(v => v.username === `Guest${guestID}`)) {
            guestID = Math.floor((Math.random() * 999) + 1).toString();
        }
        socket = {
            username: "Guest" + guestID,
            br: 0,
            role: -1,
            guest: true
        };
    } else socket.guest = false;


    const nblob = {};
    nblob.x = Math.floor(Math.random() * 600);
    nblob.y = Math.floor(Math.random() * 600);
    nblob.owner = socket.username;
    nblob.direction = 0;
    nblob.br = socket.br;
    nblob.id = data.id;
    nblob.lastnom = Date.now();
    nblob._directionChange = Date.now();
    nblob.role = socket.role;
    nblob.guest = socket.guest;
    Base.gamemodes.ffa.players.push(nblob);
    io.to(data).emit("ffaObjectsHeartbeat", Base.gamemodes.ffa.objects);
    io.to(data.id).emit("ffaHeartbeat", {
		username: socket.username,
		br: socket.br,
		role: socket.role
	});
};

module.exports = ffaPlayerCreateEvent;
