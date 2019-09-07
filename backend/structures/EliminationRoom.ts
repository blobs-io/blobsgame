import * as Room from "./Room";

export enum State {
    WAITING,
    INGAME
}

export default class EliminationRoom extends Room.default {
    static waitingTime: number = 300000;
    static waitingTimeFull: number = 120000;
    static minPlayersStartup: number = 4;
    public state: State;
    public _interval: NodeJS.Timeout;

    constructor(state = State.WAITING) {
        super(undefined, undefined, Room.Mode.ELIMINATION);
        this.state = state;
        this._interval = setInterval(() => {
            if (this.state === State.WAITING && this.startsAt >= Date.now()) {
                clearInterval(this._interval);
                this.start();
            }
        }, 1000);
    }

    get startsAt() {
        return Date.now() + (this.players.length >= EliminationRoom.minPlayersStartup ?
            EliminationRoom.waitingTimeFull :
            EliminationRoom.waitingTime);
    }

    start() {

    }

}