function isInObject(x, y, objects) {
    return objects.walls.some(v => x < (v.x + 30) && x > (v.x - 30) && y < (v.y + 30) && y > (v.y - 30));
}

const Base = require("../Base");

module.exports = class Player {
	constructor(x, y, owner, role = 0, blob = "blobowo") {
		this.owner = owner;
		this.br = 0;
		this.blob = blob;
		this.role = role;
		this.id;
		this.lastnom = Date.now();
		this.direction = 0;
		this.directionChangeCoordinates = { x, y };
		this.directionChangedAt = Date.now();
		this.guest = false;
		this.distance = 0;
		this.maximumCoordinates = { };
		this.previousX = 0;
		this.previousY = 0;
		this.health = 100;
		this.anticheat = {};
		this.x = x;
		this.y = y;
	}

	get room() {
		return Base.rooms.find(v => v.players.some(p => p.owner === this.owner));
	}

	get inProtectedArea() {
		const objects = this.room.map.map.objects;
        let inArea = false;
        let pos = { x: this.x, y: this.y };
        for (let i = 0; i < objects.noNomArea.length; ++i) {
            if (objects.noNomArea[i].startsAt.x <= pos.x
                && objects.noNomArea[i].startsAt.x + (Math.abs(objects.noNomArea[i].endsAt.x - objects.noNomArea[i].startsAt.x)) > pos.x
                && objects.noNomArea[i].startsAt.y <= pos.y
                && objects.noNomArea[i].startsAt.y + (Math.abs(objects.noNomArea[i].endsAt.y - objects.noNomArea[i].startsAt.y)) > pos.y) inArea = true;
        }
        return inArea;
    }
};
