import Base from "./structures/Base";
import Room from "./structures/Room";
import Socket from "./structures/Socket"
import Player from "./structures/Player";
import AntiCheat from "./structures/AntiCheat";

const EventTypes: any = {
    PLAYER_CREATE: "ffaPlayerCreate",
    PLAYER_KICK: "ffaKick",
    DISCONNECT: "disconnect",
    COORDINATECHANGE: "coordinateChange"
};

export default class {
    public base: Base;

    constructor(base: Base) {
        this.base = base;
    }

    executeEvent(type: string, data: any, ...args: any[]): any {
        const { io } = this.base;
        const room: Room | undefined = this.base.rooms.find((v: Room) => v.id === "ffa");

        if (type === EventTypes.PLAYER_CREATE) {
            const blob: any = args[0];
            if (!room) return;
            if (room.players.length >= 100) io.to(data.id).emit(EventTypes.PLAYER_KICK, "Too many players online (100)!");
            if (typeof blob !== "string") return;
            let socket: Socket = this.base.sockets.find((v: {sessionid:string}) => v.sessionid === blob);
            if (!socket) {
                if (room.players.some((v: Player) => v.id === data.id)) return io.to(data.id).emit("ffaKick", "Only one player per socket allowed.");
                let guestID: string = Math.floor((Math.random() * 999) + 1).toString();
                while(this.base.sockets.some((v: {username:string}) => v.username === `Guest${guestID}`)) {
                    guestID = Math.floor((Math.random() * 999) + 1).toString();
                }
                socket = {
                    username: "Guest" + guestID,
                    br: 0,
                    role: -1,
                    guest: true
                };
            } else socket.guest = false;


            const newblob: Player = new Player(this.base);
            newblob.anticheat = new AntiCheat();
            newblob.directionChangeCoordinates.x = Math.floor(Math.random() * 600);
            newblob.directionChangeCoordinates.y = Math.floor(Math.random() * 600);
            newblob.role = socket.role;
            newblob.owner = socket.username;
            newblob.br = socket.br;
            newblob.id = data.id;
            newblob.guest = socket.guest;
            newblob.maximumCoordinates = {
                width: room.map.map.mapSize.width,
                height: room.map.map.mapSize.height
            };
            room.players.push(newblob);
            io.to(data.id).emit("ffaObjectsHeartbeat", room.map.map.objects);
            io.to(data.id).emit("ffaHeartbeat", {
                username: socket.username,
                br: socket.br,
                role: socket.role,
                x: newblob.directionChangeCoordinates.x,
                y: newblob.directionChangeCoordinates.y,
                users: room.players
            });
            io.sockets.emit("ffaUserJoin", {
                ...newblob,
                x: newblob.x,
                y: newblob.y
            });
        }
        else if (type === EventTypes.DISCONNECT) {
            if (!room) return;
            const player: Player | undefined = room.players.find((v: Player) => v.id === data.id);
            if (player) {
                io.sockets.emit("ffaPlayerDelete", player.owner);
                if (!player.guest)
                    this.base.db.run("UPDATE accounts SET distance = distance + ? WHERE username = ?", player.distance / 1000, player.owner).catch(console.log);
                room.players.splice(room.players.findIndex((v: Player) => v.id === data.id), 1);
            }
        }
        else if (type === EventTypes.COORDINATECHANGE) {

        }
    }
}