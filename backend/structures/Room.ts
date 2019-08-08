import GameMap from "./GameMap";
import Player from "./Player";

export default class Room extends GameMap {
    public id: string;
    public players: Player[];
    constructor(map: any = {}, id: string = Math.random().toString(32).substr(2,6)) {
        super(map);
        this.id = id;
        this.players = [];
    }
}