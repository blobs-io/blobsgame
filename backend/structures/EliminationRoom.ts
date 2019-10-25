import * as Room from "./Room";
import Socket, {wsSocket} from "./Socket";
import {EventTypes, OPCODE, KickTypes} from "../WSEvents";
import Base from "./Base";
import Player from "./Player";

export enum State {
    WAITING,
    COUNTDOWN,
    INGAME
}

export default class EliminationRoom extends Room.default {
    static waitingTime: number = 120000;
    static minPlayersStartup: number = 2;
    public countdownStarted: number = null;
    public state: State;
    public _interval: NodeJS.Timeout;

    constructor(base: Base, map: any = {}, id: string = Math.random().toString(32).substr(2,6), state = State.WAITING) {
        super(base, map, id, Room.Mode.ELIMINATION);
        this.state = state;
        this._interval = setInterval(() => {
            if (this.state === State.COUNTDOWN && Date.now() >= this.startsAt) {
                this.start();
                clearInterval(this._interval);
            }
        }, 1000);
    }

    get startsAt() {
        if (this.state === State.WAITING) return null;
        else return this.countdownStarted + EliminationRoom.waitingTime;
    }

    start(): void {
        this.state = State.INGAME;
        this.broadcastSend(JSON.stringify({
            op: OPCODE.EVENT,
            t: EventTypes.STATECHANGE,
            d: {
                state: this.state
            }
        }));
    }

    isSingle(): boolean {
        return this.players.length === 1;
    }

    handleEnd(): void {
        if (this.isSingle() && this.state === State.INGAME) {
            const winner: Player = this.players[0];
            const socket: wsSocket = this.base.wsSockets.find(v => v.id === winner.id);
            const result: number = 125; // todo: dont hardcode

            if (!winner.guest) {
                this.base.db.run("UPDATE accounts SET br = br + ? WHERE username = ?", result, winner.owner);
            }

            if (socket) {
                socket.conn.send(JSON.stringify({
                    op: OPCODE.EVENT,
                    t: EventTypes.PLAYER_KICK,
                    d: {
                        type: KickTypes.WIN,
                        result,
                        message: null
                    }
                }));
                socket.conn.close();
                this.base.rooms.splice(this.base.rooms.findIndex(v => v.id === this.id), 1);
            }
        }
    }
}