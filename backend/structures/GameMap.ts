// Represents a map that may be used by a room
export default class GameMap {
    // The actual map object
    public map: any;
    constructor(map: any) {
        // Assign local variables
        this.map = map;
    }
}