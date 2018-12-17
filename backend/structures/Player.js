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
	}
	
	get x() {
		if (this.direction === 1) return this.directionChangeCoordinates.x + (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		else if (this.direction === 3) return this.directionChangeCoordinates.x - (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		else return this.directionChangeCoordinates.x;
	}
	
	set x(value) {
		return this._x = value;
	}
	
	get y() {
		if (this.direction === 0) return this.directionChangeCoordinates.y - (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		else if (this.direction === 2) return this.directionChangeCoordinates.y + (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		else return this.directionChangeCoordinates.y;
	}
	
	set y(value) {
		return this._y = value;
	}
};
