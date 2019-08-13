import Base from "./structures/Base";
import Room from "./structures/Room";
import Socket from "./structures/Socket"
import Player from "./structures/Player";
import AntiCheat from "./structures/AntiCheat";
import * as TierHelper from "./utils/TierHelper";
import { execSync } from "child_process";
import * as SessionIDManager from "./structures/SessionIDManager";

const EventTypes: any = {
    PLAYER_CREATE: "ffaPlayerCreate",
    PLAYER_KICK: "ffaKick",
    DISCONNECT: "disconnect",
    COORDINATECHANGE: "coordinateChange",
    DIRECTIONCHANGE: "ffaDirectionChange",
    NOMKEY: "ffaNomKey",
    PLAYER_KICK_C: "ffaKickPlayer",
    SESSIONDELETE: "sessionDelete"
};

export default class {
    public base: Base;

    constructor(base: Base) {
        this.base = base;
    }

    executeEvent(type: string, data: any, ...args: any[]): any {
        const {io} = this.base;
        const room: Room | undefined = this.base.rooms.find((v: Room) => v.id === args[1]);
        if (type === EventTypes.PLAYER_CREATE) {
            const blob: any = args[0];

            if (!room) return;

            if (room.players.length >= 100) io.to(data.id).emit(EventTypes.PLAYER_KICK, "Too many players online (100)!");

            if (typeof blob !== "string") return;

            let socket: Socket | undefined = this.base.sockets.find((v: Socket) => v.sessionid === blob);

            if (!socket) {

                if (room.players.some((v: Player) => v.id === data.id)) return io.to(data.id).emit("ffaKick", "Only one player per socket allowed.");
                let guestID: string = Math.floor((Math.random() * 999) + 1).toString();
                while (this.base.sockets.some((v: { username: string }) => v.username === `Guest${guestID}`)) {
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

            newblob.directionChangeCoordinates.x = newblob.x = Math.floor(Math.random() * 600);
            newblob.directionChangeCoordinates.y = newblob.y = Math.floor(Math.random() * 600);
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

            io.sockets.emit("ffaUserJoin", newblob);

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
            const eventd: any = args[0];
            if (typeof eventd.x !== "number" || typeof eventd.y !== "number") return;
            if (!room) return;
            let previousPlayer: Player | undefined = room.players.find((v: Player) => v.id === data.id);
            if (!previousPlayer || !previousPlayer.x || !previousPlayer.y) return;
            if (Math.abs(eventd.x - previousPlayer.x) > 50) {
                previousPlayer.anticheat.penalize(1, Math.abs(eventd.x - previousPlayer.x));
            }
            if (Math.abs(eventd.y - previousPlayer.y) > 50) {
                previousPlayer.anticheat.penalize(1, Math.abs(eventd.y - previousPlayer.y));
            }
            if (previousPlayer.anticheat.flags >= 0x14) {
                io.to(data.id).emit("ffaKick", "Too many flags.");
                data.disconnect();
            }
            eventd.lastnom = previousPlayer.lastnom;
            eventd.role = previousPlayer.role;
            if (eventd.x < 0 || isNaN(eventd.x)) eventd.x = 0;
            if (eventd.y < 0 || isNaN(eventd.y)) eventd.y = 0;
            if (eventd.x > 2000) eventd.x = 2000;
            if (eventd.y > 2000) eventd.y = 2000;
            previousPlayer.x = eventd.x;
            previousPlayer.y = eventd.y;
        }
        else if (type === EventTypes.DIRECTIONCHANGE) {
            const eventd: any = args[0];
            if (!room) return;
            if (!eventd) return;
            const player: Player | undefined = room.players.find((v: Player) => v.owner === eventd.owner);
            if (!player) return;
            if (!player.directionChangeCoordinates.x || !player.directionChangeCoordinates.y) return;
            if (typeof player.x !== "number" || typeof player.y !== "number") return;
            if (!eventd.directionChangeCoordinates) return;
            if (typeof eventd.directionChangeCoordinates.x !== "number" || typeof eventd.directionChangeCoordinates.y !== "number") return;
            player.directionChangedAt = Date.now() - eventd.directionChangedAt < 5000 ? eventd.directionChangedAt : Date.now();
            player.direction = eventd.direction;
            player.distance += Math.abs(player.directionChangeCoordinates.x - player.x) + Math.abs(player.directionChangeCoordinates.y - player.y);
            player.directionChangeCoordinates = {
                x: eventd.directionChangeCoordinates.x,
                y: eventd.directionChangeCoordinates.y
            };
            io.sockets.emit("ffaDirectionChanged", player);
        }
        else if (type === EventTypes.NOMKEY) {
            if (!room) return;
            const eventd: Player | undefined = room.players.find((v: Player) => v.id === data.id);
            if (!eventd) return;
            if (isNaN(<number>eventd.x) || isNaN(<number>eventd.y) || isNaN(eventd.br)) return;
            for (let i: number = 0; i < room.players.length; ++i) {
                const blobobj: Player = room.players[i];
                if (eventd.owner !== blobobj.owner) {
                    if (!eventd.inProtectedArea) {
                        if (typeof eventd.x !== "number" || typeof blobobj.x !== "number") continue;
                        if (typeof eventd.y !== "number" || typeof blobobj.y !== "number") continue;
                        if (eventd.x < (blobobj.x + 30) && eventd.x > (blobobj.x - 30)) {
                            if (eventd.y < (blobobj.y + 30) && eventd.y > (blobobj.y - 30)) {
                                const hasGuest: boolean = eventd.guest || blobobj.guest;
                                if (Date.now() - eventd.lastnom < 1500) return;

                                eventd.lastnom = Date.now();
                                blobobj.health -= Math.floor(Math.random() * 10) + 30;
                                if (blobobj.health > 0) {
                                    io.sockets.emit("ffaHealthUpdate", {
                                        health: blobobj.health,
                                        user: blobobj.owner
                                    });
                                    break;
                                } else {
                                    blobobj.health = 100;
                                }

                                const winner: Player | undefined = eventd;
                                const loser: Player | undefined = blobobj;

                                let result;
                                if (!isNaN(blobobj.br) && !hasGuest) {
                                    if (eventd.br === blobobj.br) --eventd.br;
                                    let execution = execSync(
                                        Base.algorithm
                                            .replace(/{ownbr}/, eventd.br.toString())
                                            .replace(/{opponentbr}/, blobobj.br.toString())
                                    ).toString();
                                    result = parseInt(execution);
                                    if (result === 0) ++result;
                                    winner.br = winner.br + result > 9999 ? 9999 : winner.br + result;
                                    loser.br = loser.br - result <= 0 ? 1 : loser.br - result;

                                    this.base.db.run("UPDATE accounts SET br = ? WHERE username = ?", loser.br, loser.owner).catch(console.log);
                                    this.base.db.run("UPDATE accounts SET br = ? WHERE username = ?", winner.br, winner.owner).catch(console.log);
                                    this.base.db.run("UPDATE accounts SET wins = wins + 1 WHERE username = ?", winner.owner).catch(console.log);
                                    this.base.db.run("UPDATE accounts SET losses = losses + 1 WHERE username = ?", loser.owner).catch(console.log);

                                    const dropResult: {
                                        winner: TierHelper.Promotion | void,
                                        loser: TierHelper.Promotion | void
                                    } = {
                                        winner: TierHelper.promotedTo(winner.br - result, winner.br),
                                        loser: TierHelper.promotedTo(winner.br + result, winner.br)
                                    };

                                    if (dropResult.winner) {
                                        this.base.db.run("INSERT INTO recentPromotions VALUES (?, ?, ?, ?)", winner.owner, dropResult.winner.newTier, dropResult.winner.drop, Date.now()).catch(console.log);
                                    }
                                    if (dropResult.loser) {
                                        this.base.db.run("INSERT INTO recentPromotions VALUES (?, ?, ?, ?)", loser.owner, dropResult.loser.newTier, dropResult.loser.drop, Date.now()).catch(console.log);
                                    }
                                }

                                loser.directionChangeCoordinates.x = Math.floor(Math.random() * 2000);
                                loser.directionChangeCoordinates.y = Math.floor(Math.random() * 2000);
                                loser.directionChangedAt = Date.now();

                                io.sockets.emit("ffaPlayerNommed", {
                                    winner, loser, result: typeof result !== "undefined" ? result : 0
                                });

                            }
                        }
                    }
                }
            }

        }
        else if (type === EventTypes.PLAYER_KICK_C) {
            if (!room) return;
            const requester: Player | undefined = room.players.find((v: Player) => v.id === data.id);
            const eventd: any = args[0];
            if (!requester) return;
            if (typeof eventd.user !== "string" || typeof eventd.reason !== "string") return;
            if (requester.role !== 1) {
                io.to(data.id).emit("ffaKick", "Insufficient permissions.");
                return data.disconnect();
            } else {
                const target: Player | undefined = room.players.find((v: Player) => v.owner === eventd.user);
                if (!target || !target.id) return;
                if (eventd.reason.length < 1 || eventd.reason.length > 256) return;
                io.to(target.id).emit("ffaKick", eventd.reason);
                io.sockets.sockets[target.id].disconnect();
            }
        }
        else if (type === EventTypes.SESSIONDELETE) {
            const session: any = args[0];
            if (typeof session !== "string") return;
            SessionIDManager.deleteSession(this.base.db, {
                type: "session",
                value: session
            }).then(() => {
                io.to(data.id).emit("sessionDelete");
            }).catch(console.log);
        }
    }
}