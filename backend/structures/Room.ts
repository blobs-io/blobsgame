import GameMap from "./GameMap";
import Player from "./Player";

export const Mode: any = {
    FFA: "ffa",
    ELIMINATION: "elimination"
};

export default class Room extends GameMap {
    public id: string;
    public players: Player[];
    public mode: string;
    public createdAt: number;
    constructor(map: any = {}, id: string = Math.random().toString(32).substr(2,6), mode: string = Mode.FFA) {
        super(map);
        this.id = id;
        this.mode = mode;
        this.players = [];
        this.createdAt = Date.now();
    }

    get uptime() {
        return Date.now() - this.createdAt;
    }
}