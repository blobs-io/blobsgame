import GameMap from "./GameMap";
import Player from "./Player";
import {wsSocket} from "./Socket";
import {EventTypes, OPCODE} from "../WSEvents";
import Base from "./Base";

export const Mode: any = {
    FFA: "ffa",
    ELIMINATION: "elimination"
};

export default class Room extends GameMap {
    public id: string;
    public players: Player[];
    public mode: string;
    public createdAt: number;
    public base: Base;
    constructor(base: Base, map: any = {}, id: string = Math.random().toString(32).substr(2,6), mode: string = Mode.FFA) {
        super(map);
        this.id = id;
        this.mode = mode;
        this.players = [];
        this.createdAt = Date.now();
        this.base = base;
    }

    get uptime() {
        return Date.now() - this.createdAt;
    }

    broadcast(fn: (ws: wsSocket, player?: Player) => any): void {
        for (let i: number = 0; i < this.players.length; ++i) {
            const socket: wsSocket | undefined = this.base.wsSockets.find((v: wsSocket) => v.id === this.players[i].id);
            if (!socket) continue;
            fn(socket, this.players[i]);
        }
    }

    broadcastSend(str: string) {
        this.broadcast(ws => ws.conn.send(str));
    }
}