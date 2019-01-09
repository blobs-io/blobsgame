// Wall structure
class WallObj {
    constructor(x = Math.floor(Math.random() * (canvas.width - 50) + 25), y = Math.floor(Math.random() * (canvas.width - 50) + 25)) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.img = new Image();
        this.img._ready = false;
        this.url = "../assets/brickwall.png";
        this.type = 0;
    }

    setImage(img = this.url) {
        return new Promise((a, b) => {
            this.img.src = img;
            this.img.onload = () => a(), this.img._ready = true;
        });
    }

    display() {
        return new Promise((a, b) => {
            if (!this.img._ready) b("Image not loaded.");
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        });
    }
}

// Blob structure
class BlobCode {
    static get blobowo() {
        return "../assets/blobowo.png";
    }
    static get blobevil() {
        return "../assets/blobevil.png";
    }
    static get blobeyes() {
        return "../assets/blobeyes.png";
    }
    static get blobkittenknife() {
        return "../assets/BlobKittenKnife.png";
    }
    static get blobpeek() {
        return "../assets/blobpeek.png";
    }
    static get partyblob() {
        return "../assets/partyblob.gif";
    }
    static get blobnom() {
        return "../assets/blobnom.png";
    }
}

function isInObject(x, y) {
    return objects.walls.some(v => x < (v.x + 30) && x > (v.x - 30) && y < (v.y + 30) && y > (v.y - 30));
}

class BlobObj {
    constructor(br, owner, x = window.innerWidth / 2, y = window.innerHeight / 2) {
        this.guest = false;
        this.owner = owner;
        this.br = br;
        this.img = new Image();
        this._direction = 0;
        this.lastnom = 0;
        this.directionChangedAt = Date.now();
        this.directionChangeCoordinates = {
            x,
            y
        };
        this.previousX = 0;
        this.previousY = 0;
    }
    
    get x() {
		let x = this.directionChangeCoordinates.x;
		if (this.direction === 1) x = this.directionChangeCoordinates.x + (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		else if (this.direction === 3) x = this.directionChangeCoordinates.x - (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		if (x < 0) x = 0;
		else if (x > 2000) x = 2000;
		if (isInObject(x, this.previousY)) x = this.previousX;
        else this.previousX = x;
		return x;
	}
	
	set x(value) {
		return this._x = value;
	}
	
	get y() {
		let y = this.directionChangeCoordinates.y;
		if (this.direction === 0) y = this.directionChangeCoordinates.y - (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		else if (this.direction === 2) y =  this.directionChangeCoordinates.y + (1.025 * ((Date.now() - this.directionChangedAt) / 20));
		if (y < 0) y = 0;
		else if (y > 2000) y = 2000;
        if (isInObject(this.previousX, y)) y = this.previousY;
        else this.previousY = y;
		return y;
	}
	
	set y(value) {
		return this._x = value;
	}

    get direction() {
        return this._direction;
    }

    set direction(value) {
		const newX = this.x;
		const newY = this.y;
        this.directionChangedAt = Date.now();
        this.directionChangeCoordinates = {
            x: newX,
            y: newY
        };
        return this._direction = value;
    }

    setBlob(blobimage = BlobCode.blobowo) {
        if (blobimage === BlobCode.partyblob0) blobimage = BlobCode.blobowo;
        return new Promise((a, b) => {
            try {
                this.img.src = blobimage;
                this.img.onload = () => a(), this.img._ready = true;
            } catch (e) {
                b(e);
            }
        });
    }

    display(du = false, dbr = false, w = 30, h = 30) {
        return new Promise((a, b) => {
            if (!this.img._ready) b("Image not loaded.");
            const canvasX = canvas.width / 2 - w;
            const canvasY = canvas.height / 2 - h;
            const tier = getTier(this.br || 0);
            if (typeof this.owner === "undefined") return;
            if (this.owner === ownBlob.owner) {
				ctx.fillStyle = "#" + tier.colorCode;
                ctx.font = (15 * scale).toString() + "px Dosis";
                ctx.drawImage(this.img, canvasX, canvasY, w * scale, h * scale);
                ctx.fillText(this.owner + (dbr === true ? ` (${this.br})` : ""), canvasX, (canvasY) - 10);
                ctx.fillStyle = "white";
                if (emblems[tier.tier].complete) {
                    ctx.drawImage(emblems[tier.tier], canvasX - (15 + 15 * scale), canvasY - (10 + 15 * scale), 20 * scale, 20 * scale);
                }
            } else {
                let blobCanvasX = 0,
                    blobCanvasY = 0;
                if (ownBlob.x >= this.x) {
                    blobCanvasX = (canvas.width / 2) - (ownBlob.x - this.x);
                } else if (ownBlob.x < this.x) {
                    blobCanvasX = (canvas.width / 2) + (this.x - ownBlob.x);
                }

                if (ownBlob.y >= this.y) {
                    blobCanvasY = (canvas.height / 2) - (ownBlob.y - this.y);
                } else if (ownBlob.y < this.y) {
                    blobCanvasY = (canvas.height / 2) + (this.y - ownBlob.y);
                }

                blobCanvasY -= h;
                blobCanvasX -= w;
                
				if (emblems[tier.tier].complete) {
				    ctx.drawImage(emblems[tier.tier], blobCanvasX - (15 + 15 * scale), blobCanvasY - (10 + 15 * scale), 20 * scale, 20 * scale);
                }

				ctx.fillStyle = "#" + tier.colorCode;
				
                ctx.drawImage(this.img, blobCanvasX, blobCanvasY, w * scale, h * scale);
                if (du === true) {
                    ctx.font = (15 * scale).toString() + "px Dosis";
                    ctx.fillText(this.owner + (dbr === true ? ` (${this.br})` : ""), blobCanvasX, (blobCanvasY) - 10);
                    ctx.fillStyle = "white";
                }
            }
        });
    }

    static display(arr, du = false, dbr = false, w = 30, h = 30) {
        if (typeof arr === "object" && arr != null) {
            if (arr.constructor.name === "Array") {
                for (const blob of arr) {
                    blob.display(du, dbr, w, h);
                }
            }
        }
    }
}
