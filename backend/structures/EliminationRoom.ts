// Imports
import * as Room from "./Room";
import Socket, {wsSocket} from "./Socket";
import {EventTypes, OPCODE, KickTypes} from "../WSEvents";
import Base from "./Base";
import Player from "./Player";

// Represents a state for an elimination room
export enum State {
    // Not enough players
    WAITING,
    // During countdown phase
    COUNTDOWN,
    // Ingame
    INGAME
}

export default class EliminationRoom extends Room.default {
    // The number of milliseconds users have to wait when the room enters COUNTDOWN phase
    static waitingTime: number = 120000;
    // The number of players that need to be in a room for the COUNTDOWN phase to start
    static minPlayersStartup: number = 2;
    // The timestamp of when the room has entered the COUNTDOWN phase
    public countdownStarted: number = null;
    // This rooms state
    public state: State;
    // Identifier for interval that checks for ellapsed time
    public _interval: NodeJS.Timeout;

    constructor(base: Base, map: any = {}, id: string = Math.random().toString(32).substr(2,6), state = State.WAITING) {
        super(base, map, id, Room.Mode.ELIMINATION);
        this.state = state;
        // Check every second if ellapsed time is >= waitingTime
        this._interval = setInterval(() => {
            if (this.state === State.COUNTDOWN && Date.now() >= this.startsAt) {
                // Start room
                this.start();
                clearInterval(this._interval);
            }
        }, 1000);
    }

    // Returns the timestamp of when the room is going to start
    // Note: room must not be in WAITING state for this getter
    // else `null` will be returned
    get startsAt() {
        if (this.state === State.WAITING) return null;
        else return this.countdownStarted + EliminationRoom.waitingTime;
    }

    // Starts this room
    public start(): void {
        // Set state to INGAME
        this.state = State.INGAME;
        // Emit state change event to all websockets in this room
        this.broadcastSend(JSON.stringify({
            op: OPCODE.EVENT,
            t: EventTypes.STATECHANGE,
            d: {
                state: this.state
            }
        }));
    }

    // Whether there is only one player left (used to determine whether the room has ended)
    public isSingle(): boolean {
        return this.players.length === 1;
    }

    // Called to check if room has ended (e.g. due to disconnections)
    // If there is only 1 player left, they will gain br
    public handleEnd(): void {
        // Check state
        if (this.isSingle() && this.state === State.INGAME) {
            // Get winning socket
            const winner: Player = this.players[0];
            const socket: wsSocket = this.base.wsSockets.find(v => v.id === winner.id);
            const result: number = 125; // todo: dont hardcode

            // Check whether the winner is a guest
            // If they are a guest, don't transfer br
            if (!winner.guest) {
                winner.saveDistance();
                this.base.db.run("UPDATE accounts SET br = br + ? WHERE username = ?", result, winner.owner);
            }

            // Emit WIN KickType to winning player
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

                // Disconnect socket
                socket.conn.close();
            }
            
            // Finally remove room from rooms array
            this.base.rooms.splice(this.base.rooms.findIndex(v => v.id === this.id), 1);
        }
    }
}