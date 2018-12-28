const GameMap = require("./GameMap");

module.exports = class Room extends GameMap {
    constructor(map = {}, id = Math.random().toString(32).substr(2,6)) {
        super(map);
        this.id = id;
        this.players = [];
    }
};