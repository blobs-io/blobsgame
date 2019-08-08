import * as fs from "fs";
import GameMap from "./GameMap";


export default class Maps {
    public mapStore: any[];
    constructor(mapPath: string = "./maps") {
        this.mapStore = [];
        for (const map of fs.readdirSync(mapPath).filter(v => v.endsWith(".json"))) {
            const mapJSON: any = require(`../../maps/${map}`);
            this.mapStore.push(new GameMap(mapJSON));
        }
    }
}