import * as Room from "./Room";
import {wsSocket} from "./Socket";
import {EventTypes, OPCODE} from "../WSEvents";
import Base from "./Base";

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

    start() {
        this.state = State.INGAME;
        this.broadcastSend(JSON.stringify({
            op: OPCODE.EVENT,
            t: EventTypes.STATECHANGE,
            d: {
                state: this.state
            }
        }));
    }
}