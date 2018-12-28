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
	}
	
	get x() {
		let x = this.directionChangeCoordinates.x;
		if (this.direction === 1) x = this.directionChangeCoordinates.x + (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		else if (this.direction === 3) x = this.directionChangeCoordinates.x - (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		if (x < 0) x = 0;
		else if (x > this.maximumCoordinates.width) x = this.maximumCoordinates.width;
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
		return y;
	}
	
	set y(value) {
		return this._y = value;
	}
};
