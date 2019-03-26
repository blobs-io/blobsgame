class ffaPlayerCreateEvent {};
const Player = require("../structures/Player");

ffaPlayerCreateEvent.run = async (...args) => {
    const [blob, io, Base, data, sockets] = args;
    const room = Base.rooms[Base.rooms.findIndex(v => v.id === "ffa")];
    if (room.players.length >= 100) return io.to(data.id).emit("ffaKick", "Too many players online (100).");
    if (typeof blob !== "string") return;
    let socket = sockets.find(v => v.sessionid === blob);
    if (!socket) {
        if (room.players.some(v => v.id === data.id)) return io.to(data.id).emit("ffaKick", "Only one player per socket allowed.");
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


    const nblob = new Player();
    nblob.directionChangeCoordinates.x = Math.floor(Math.random() * 600);
    nblob.directionChangeCoordinates.y = Math.floor(Math.random() * 600);
    nblob.role = socket.role;
    nblob.owner = socket.username;
    nblob.br = socket.br;
    nblob.id = data.id;
    nblob.guest = socket.guest;
    nblob.maximumCoordinates = {
        width: room.map.map.mapSize.width,
        height: room.map.map.mapSize.height
    };
    room.players.push(nblob);
    io.to(data.id).emit("ffaObjectsHeartbeat", room.map.map.objects);
    io.to(data.id).emit("ffaHeartbeat", {
		username: socket.username,
		br: socket.br,
		role: socket.role,
		x: nblob.directionChangeCoordinates.x,
		y: nblob.directionChangeCoordinates.y,
		users: room.players
	});
	io.sockets.emit("ffaUserJoin", Object.assign(nblob, {x: nblob.x, y: nblob.y}));
};

module.exports = ffaPlayerCreateEvent;
