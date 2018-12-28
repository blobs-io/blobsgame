const fs = require("fs");
const GameMap = require("./GameMap");

module.exports = class Maps {
    constructor(mapPath = "./maps/") {
        this.mapStore = [];
        for (const map of fs.readdirSync(mapPath).filter(v => v.endsWith(".json"))) {
            const mapJSON = require(`../../maps/${map}`);
            const tempMap = new GameMap(mapJSON);
            this.mapStore.push(tempMap);
        }
    }
};