module.exports = class GameMap {
    constructor(name, players = [], objects = { walls: [] }) {
        this.id;
        this.map = name;
        this.players = players;
        this.objects = objects;
    }
};