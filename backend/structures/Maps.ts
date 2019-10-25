// Imports
import * as fs from "fs";
import GameMap from "./GameMap";

// Represents a map store
export default class Maps {
    // An array of GameMap objects
    public mapStore: GameMap[];
    
    constructor(mapPath: string = "./maps") {
        this.mapStore = [];
        for (const map of fs.readdirSync(mapPath).filter(v => v.endsWith(".json"))) {
            const mapJSON: any = require(`../../maps/${map}`);
            this.mapStore.push(new GameMap(mapJSON));
        }
    }
}