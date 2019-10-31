import Base from "./structures/Base";
import Room, {Mode} from "./structures/Room";
import Socket, {wsSocket} from "./structures/Socket"
import Player, { Role } from "./structures/Player";
import AntiCheat from "./structures/AntiCheat";
import * as TierHelper from "./utils/TierHelper";
import { execSync } from "child_process";
import * as EliminationRoom from "./structures/EliminationRoom";

export enum EventTypes {
    PLAYER_KICK = "kick",
    COORDINATECHANGE = "coordinateChange",
    DIRECTIONCHANGE = "directionChange",
    NOMKEY = "nomKey",
    STATECHANGE = "stateChange",
    PLAYER_NOMMED = "playerNommed",
    PLAYER_KICK_C = "kickPlayer",
    HEARTBEAT = "heartbeat"
}

export enum KickTypes {
    ROOM_FULL = "roomFull",
    ROOM_INGAME = "roomIngame",
    TOO_MANY_SOCKETS = "tooManySockets",
    CLIENT_MOD = "clientMod",
    MOD_KICK = "modKick",
    ELIMINATED = "eliminated",
    WIN = "win",
    ROOM_END = "roomEnd"
}

export enum OPCODE {
    HELLO = 1,
    HEARTBEAT = 2,
    EVENT = 3,
    CLOSE = 4
}

export interface EventData {
    op: OPCODE,
    d: any,
    t: string
}

export default class WSHandler {
    public base: Base;
    static interval: number = 3000;
    static intervalLimit: number = 10000;

    constructor(base: Base) {
        this.base = base;
    }

    async exec(conn: any, id: string, data: any): Promise<any> {
        let parsed: EventData;
        try {
            parsed = JSON.parse(data);
        } catch(e) {
            return;
        }
        const { op, d, t } = parsed;
        if (typeof op !== "number" || typeof d !== "object") return;
        if (op === OPCODE.HELLO) {
            const session: any = d.session;
            const room: EliminationRoom.default | Room | undefined = this.base.rooms.find((r: Room) => r.id === d.room && r.mode === d.mode);

            if (!room) return;
            if (room.players.length >= 100)
                return conn.send(JSON.stringify({
                    op: OPCODE.EVENT,
                    d: {
                        type: KickTypes.ROOM_FULL,
                        message: "Too many players online (100)"
                    },
                    t: EventTypes.PLAYER_KICK
                }));

            if (room instanceof EliminationRoom.default && room.state !== EliminationRoom.State.COUNTDOWN && room.state !== EliminationRoom.State.WAITING)
                return conn.send(JSON.stringify({
                    op: OPCODE.EVENT,
                    d: {
                        type: KickTypes.ROOM_INGAME,
                        message: "Room is already in-game"
                    },
                    t: EventTypes.PLAYER_KICK
                }));

            if (typeof session !== "string") return;

            let socket: Socket | undefined = this.base.sockets.find((v: Socket) => v.sessionid === session);
            let blob: string;

            if (!socket) {
                if (room.players.some((v: Player) => v.id === id))
                    return conn.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        d: {
                            type: KickTypes.TOO_MANY_SOCKETS,
                            message: "Only one socket per client allowed"
                        },
                        t: EventTypes.PLAYER_KICK
                    }));
                let guestID: string = Math.floor((Math.random() * 9999) + 1).toString();
                while (this.base.sockets.some((v: Socket) => v.username === `Guest${guestID}`)) {
                    guestID = Math.floor((Math.random() * 9999) + 1).toString();
                }
                socket = {
                    username: "Guest" + guestID,
                    br: 0,
                    role: Role.GUEST,
                    guest: true
                };
                blob = "blobowo";
            } else {
                const user: any = await this.base.db.get("SELECT activeBlob FROM accounts WHERE username = ?", socket.username);
                blob = user.activeBlob;
                socket.guest = false;
            }


            const newblob: Player = new Player(this.base);

            newblob.anticheat = new AntiCheat();
            newblob.blob = blob;
            newblob.directionChangeCoordinates.x = newblob.x = Math.floor(Math.random() * 600);
            newblob.directionChangeCoordinates.y = newblob.y = Math.floor(Math.random() * 600);
            newblob.role = socket.role;
            newblob.owner = socket.username;
            newblob.br = socket.br;
            newblob.id = id;
            newblob.guest = socket.guest;

            newblob.maximumCoordinates = {
                width: room.map.map.mapSize.width,
                height: room.map.map.mapSize.height
            };


            room.players.push(newblob);

            const objectSend: any = {
                op: OPCODE.EVENT,
                d: {
                    user: {
                        username: socket.username,
                        br: socket.br,
                        role: socket.role,
                        x: newblob.directionChangeCoordinates.x,
                        y: newblob.directionChangeCoordinates.y,
                        blob
                    },
                    users: room.players,
                    objects: room.map.map.objects,
                    interval: WSHandler.interval,
                    roomCreatedAt: room.createdAt
                },
                t: EventTypes.HEARTBEAT
            };

            if (room instanceof EliminationRoom.default) {
                if (room.players.length >= EliminationRoom.default.minPlayersStartup && room.state === EliminationRoom.State.WAITING) {
                    room.state = EliminationRoom.State.COUNTDOWN;
                    room.countdownStarted = Date.now();
                    room.broadcastSend(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventTypes.STATECHANGE,
                        d: {
                            state: room.state,
                            countdownStarted: room.countdownStarted
                        }
                    }));
                }
                objectSend.d.state = room.state;
                objectSend.d.waitingTime = EliminationRoom.default.waitingTime;
                objectSend.d.countdownStarted = room.countdownStarted;
            }

            conn.send(JSON.stringify(objectSend));
        }
        else if (op === OPCODE.HEARTBEAT) {
            if (!d || !d.room) return;
            const room: Room | undefined = this.base.rooms.find((r: Room) => r.id === d.room);
            if (!room) return;
            const player: Player | undefined = room.players.find((p: Player) => p.id === id);
            if (!player) return;

            player.lastHeartbeat = Date.now();
        }
        else if (op === OPCODE.EVENT) {
            if (t === EventTypes.COORDINATECHANGE) {
                if (typeof d.x !== "number" || typeof d.y !== "number") return;
                const room: Room | undefined = this.base.rooms.find((v: Room) => v.id === d.room);
                if (!room) return;
                let previousPlayer: Player | undefined = room.players.find((v: Player) => v.id === id);
                if (!previousPlayer || !Number.isFinite(previousPlayer.x) || !Number.isFinite(previousPlayer.y) || !previousPlayer.anticheat) return;
                if (Math.abs(d.x - previousPlayer.x) > 50) {
                    previousPlayer.anticheat.penalize(1, Math.abs(d.x - previousPlayer.x));
                }
                if (Math.abs(d.y - previousPlayer.y) > 50) {
                    previousPlayer.anticheat.penalize(1, Math.abs(d.y - previousPlayer.y));
                }
                if (previousPlayer.anticheat.flags >= 0x14) {
                    conn.send(JSON.stringify({
                        op: OPCODE.CLOSE,
                        d: {
                            message: "Too many flags"
                        }
                    }));
                    WSHandler.disconnectSocket(<wsSocket>this.base.wsSockets.find(v => v.id === id), room);
                    return;
                }

                if (previousPlayer.role !== Role.ADMIN && (d.x < 0 || isNaN(d.x))) d.x = 0;
                if (previousPlayer.role !== Role.ADMIN && (d.y < 0 || isNaN(d.y))) d.y = 0;
                if (previousPlayer.role !== Role.ADMIN && d.x > 2000) d.x = 2000;
                if (previousPlayer.role !== Role.ADMIN && d.y > 2000) d.y = 2000;
                previousPlayer.x = d.x;
                previousPlayer.y = d.y;
            }
            else if (t === EventTypes.DIRECTIONCHANGE) {
                const room: Room | undefined = this.base.rooms.find((v: Room) => v.id === d.room);
                if (!room) return;
                if (!d) return;
                const player: Player | undefined = room.players.find((v: Player) => v.id === id);
                if (!player) return;
                if (!player.directionChangeCoordinates.x || !player.directionChangeCoordinates.y) return;
                if (typeof player.x !== "number" || typeof player.y !== "number") return;
                if (!d.directionChangeCoordinates) return;
                if (typeof d.directionChangeCoordinates.x !== "number" || typeof d.directionChangeCoordinates.y !== "number") return;
                player.directionChangedAt = Date.now() - d.directionChangedAt < 5000 ? d.directionChangedAt : Date.now();
                player.direction = d.direction;
                player.distance += Math.abs(player.directionChangeCoordinates.x - player.x) + Math.abs(player.directionChangeCoordinates.y - player.y);
                player.directionChangeCoordinates = {
                    x: d.directionChangeCoordinates.x,
                    y: d.directionChangeCoordinates.y
                };
            }
            else if (t === EventTypes.PLAYER_KICK_C) {
                const room: Room | undefined = this.base.rooms.find((v: Room) => v.id === d.room);
                if (!room) return;
                const requester: Player | undefined = room.players.find((v: Player) => v.id === id);
                if (!requester) return;
                if (typeof d.user !== "string" || typeof d.reason !== "string") return;
                if (requester.role !== Role.ADMIN) {
                    conn.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventTypes.PLAYER_KICK,
                        d: {
                            type: KickTypes.CLIENT_MOD,
                            message: "Insufficient permissions."
                        }
                    }));
                    WSHandler.disconnectSocket(<wsSocket>this.base.wsSockets.find((v: wsSocket) => v.id === id), room);
                    return;
                } else {
                    const target: Player | undefined = room.players.find((v: Player) => v.owner === d.user);
                    if (!target || !target.id) return;
                    if (d.reason.length < 1 || d.reason.length > 256) return;
                    const socket: wsSocket | undefined = this.base.wsSockets.find((v: wsSocket) => v.id === target.id);
                    if (!socket) return;
                    socket.conn.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventTypes.PLAYER_KICK,
                        d: {
                            type: KickTypes.MOD_KICK,
                            message: d.reason
                        }
                    }));
                    socket.conn.close();
                }
            }
            else if (t === EventTypes.NOMKEY) {
                const room: Room | EliminationRoom.default | undefined = this.base.rooms.find((v: Room) => v.id === d.room);
                if (!room) return;
                if (room instanceof EliminationRoom.default && room.state !== EliminationRoom.State.INGAME) return;
                const eventd: Player | undefined = room.players.find((v: Player) => v.id === id);
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
                                    if (blobobj.health > 0)
                                        break;
                                    else {
                                        if (room instanceof EliminationRoom.default) {
                                            const targetWs: wsSocket = this.base.wsSockets.find((s: wsSocket) => s.id === blobobj.id);
                                            targetWs.conn.send(JSON.stringify({
                                                op: OPCODE.EVENT,
                                                t: EventTypes.PLAYER_KICK,
                                                d: {
                                                    type: KickTypes.ELIMINATED,
                                                    result: 0, // TODO: calculate BR loss (if not guest)
                                                    message: "You were nommed by " + eventd.owner
                                                }
                                            }));
                                            WSHandler.disconnectSocket(targetWs, room);
                                            return;
                                        }
                                        else blobobj.health = 100;
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


                                    for (let j: number = 0; j < room.players.length; ++j) {
                                        const socket: wsSocket | undefined = this.base.wsSockets.find((v: wsSocket) => v.id === room.players[i].id);
                                        if (!socket) continue;
                                        socket.conn.send(JSON.stringify({
                                            op: OPCODE.EVENT,
                                            t: EventTypes.PLAYER_NOMMED,
                                            d: {
                                                winner, loser, result: typeof result !== "undefined" ? result : 0
                                            }
                                        }));
                                    }

                                }
                            }
                        }
                    }
                }
            }
        }
        else if (op === OPCODE.CLOSE) {
            if (!d.room) return;
            const room: Room | undefined = this.base.rooms.find(v => v.id === d.room);
            if (!room) return;
            WSHandler.disconnectSocket(this.base.wsSockets.find(v => v.id === id), room);
        }
    }

    static disconnectSocket(socket: wsSocket, room: Room, code?: number, handle: boolean = true): void {
        socket.conn.close(code);
        const playerIndex: number = room.players.findIndex(p => p.id === socket.id);
        const player: Player = room.players[playerIndex];
        if (!player) return;
        if (!player.guest) {
            player.saveDistance();
        }
        room.players.splice(playerIndex, 1);
        if (room instanceof EliminationRoom.default)
            room.handleEnd();
    }
}