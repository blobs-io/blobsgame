// Events (socket.io)
socket.on("ffaPlayerDelete", eventd => {
    blobs.splice(blobs.findIndex(v => v.owner === eventd), 1);
});
socket.on("ffaLoginFailed", str => alert(str));
socket.on("ffaObjectsHeartbeat", eventd => {
    for (let i = 0; i < eventd.walls.length; ++i) {
        const wall = new WallObj(eventd.walls[i].x, eventd.walls[i].y);
        wall.type = eventd.walls[i].type;
        objects.walls.push(wall);
    }
    objects.noNomAreas = [];
    for (let i = 0; i < eventd.noNomArea.length; ++i) {
        const area = new NoNomArea(eventd.noNomArea[i].startsAt, eventd.noNomArea[i].endsAt);
        objects.noNomAreas.push(area);
    }
});
socket.on("ffaHeartbeat", async d => {
    if (d.role == -1 && !/[\?\&]guest=true/.test(window.location.search)) return document.location.href = "/login/";
    ownBlob.owner = d.username;
    ownBlob.directionChangedAt = Date.now();
    ownBlob.directionChangeCoordinates.x = d.x;
    ownBlob.directionChangeCoordinates.y = d.y;
    ownBlob.br = d.br;
    ownBlob.ready = true;
    ownBlob.role = d.role;
    blobs.push(ownBlob);
    for (const blob of d.users) {
		if (blob.owner !== ownBlob.owner && !blobs.some(v => v.owner === blob.owner)) {
			const n = new BlobObj(blob.br, blob.owner);
			n.directionChangeCoordinates = {
				x: blob._x,
				y: blob._y
			};
			n.directionChangedAt = blob.directionChangedAt;
			await n.setBlob();
			n.display(true, true);
			blobs.push(n);
		}
	}
});
socket.on("ffaUnauthorized", () => document.location.href = "/login/");
socket.on("ffaDirectionChanged", d => {
	if (d.owner === ownBlob.owner) return;
	const target = blobs[blobs.findIndex(v => v.owner === d.owner)];
	if (typeof target === "undefined") return;
	target.direction = d.direction;
});
socket.on("ffaUserJoin", async d => {
	if (d.owner === ownBlob.owner) return;
	if (blobs.some(v => v.owner === d.owner)) return;
	const n = new BlobObj(d.br, d.owner);
	n.directionChangeCoordinates = {
		x: d._x,
		y: d._y
	};
	n.directionChangedAt = d.directionChangedAt;
    await n.setBlob();
    n.display(true, true);
    blobs.push(n);
});


// Events (Window/Document)
for(const btnid of ["btnup", "btndown", "btnleft", "btnright", "nom-btn-mobile"]) {
	document.getElementById(btnid).addEventListener("click", () => {
		switch(btnid) {
			case "btnup":
            ownBlob.direction = 0;
			break;
			case "btndown":
            ownBlob.direction = 2;
			break;
			case "btnleft":
			ownBlob.direction = 3
			break;
			case "btnright":
			ownBlob.direction = 1;
			break;
			case "nom-btn-mobile":
            if (Date.now() - ownBlob.lastnom <= 1500) return;
            ownBlob.lastnom = Date.now();
            socket.emit("ffaNomKey");
			break;
		}
	});
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth - 30;
    canvas.height = window.innerHeight - 30;
});

document.addEventListener("keydown", eventd => {
    switch (eventd.keyCode) {
        case 13: // newline
            ownBlob.direction = 4;
			socket.emit("ffaDirectionChange", Object.assign(ownBlob, { _direction: 4, time: Date.now() }));
            break;
        case 87: // w
            ownBlob.direction = 0;
            socket.emit("ffaDirectionChange", Object.assign(ownBlob, { _direction: 0, time: Date.now() }));
            break;
        case 68: // d
            ownBlob.direction = 1;
            socket.emit("ffaDirectionChange", Object.assign(ownBlob, { _direction: 1, time: Date.now() }));
            break;
        case 83: // s
            ownBlob.direction = 2;
            socket.emit("ffaDirectionChange", Object.assign(ownBlob, { _direction: 2, time: Date.now() }));
            break;
        case 65: // a
            ownBlob.direction = 3;
            socket.emit("ffaDirectionChange", Object.assign(ownBlob, { _direction: 3, time: Date.now() }));
            break;
        case 78: // n
            if (Date.now() - ownBlob.lastnom <= 1500) return;
            ownBlob.lastnom = Date.now();
            socket.emit("ffaNomKey");
            break;
        default:
            break;
    }
});

const mouseScrollEvent = (...eventd) => {
    let [event] = eventd;
    if (typeof event === "undefined") event = window.event;
    var deltaValue = 0;
    if (event.wheelDelta) {
        deltaValue = event.wheelDelta / 120;
    } else if (event.detail) {
        deltaValue = -event.detail / 3;
    }
    if (!deltaValue) return;

    if (deltaValue < 0 && scale > .5) scale -= .1;
    else if (scale < 7) scale += .1;
};

if (window.addEventListener) {
    window.addEventListener("DOMMouseScroll", mouseScrollEvent);
}
window.onmousewheel = document.onmousewheel = mouseScrollEvent;
