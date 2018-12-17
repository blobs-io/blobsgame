module.exports = class Player {
	constructor(x, y, owner, role = 0, blob = "blobowo") {
		this.x = x;
		this.y = y;
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
};
