import * as Room from "./Room";

export enum State {
    WAITING
}

export default class EliminationRoom extends Room.default {
    constructor() {
        super(undefined, undefined, Room.Mode.ELIMINATION);
    }

    start() {

    }
}