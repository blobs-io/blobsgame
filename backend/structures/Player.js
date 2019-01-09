function isInObject(x, y, objects) {
    return objects.walls.some(v => x < (v.x + 30) && x > (v.x - 30) && y < (v.y + 30) && y > (v.y - 30));
}

const Base = require("../Base");

module.exports = class Player {
	constructor(x, y, owner, role = 0, blob = "blobowo") {
		this._x = x;
		this._y = y;
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
	}

	get room() {
		return Base.rooms.find(v => v.players.some(p => p.owner === this.owner));
	}

	get x() {
		let x = this.directionChangeCoordinates.x;
		if (this.direction === 1) x = this.directionChangeCoordinates.x + (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		else if (this.direction === 3) x = this.directionChangeCoordinates.x - (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		if (x < 0) x = 0;
		else if (x > this.maximumCoordinates.width) x = this.maximumCoordinates.width;
        if (isInObject(x, this.previousY, this.room.map.map.objects)) {
            x = this.previousX - 30;
            this.direction = 4;
        }
        else this.previousX = x;
		return x;
	}
	
	set x(value) {
		return this._x = value;
	}
	
	get y() {
		let y = this.directionChangeCoordinates.y;
		if (this.direction === 0) y = this.directionChangeCoordinates.y - (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		else if (this.direction === 2) y = this.directionChangeCoordinates.y + (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		if (y < 0) y = 0;
		else if (y > this.maximumCoordinates.height) y = this.maximumCoordinates.height;
        if (isInObject(this.previousX, y, this.room.map.map.objects)) {
            y = this.previousY - 30;
            this.direction = 4;
        }
        else this.previousY = y;
		return y;
	}
	
	set y(value) {
		return this._y = value;
	}
};
