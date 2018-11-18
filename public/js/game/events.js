// Events (socket.io)
socket.on("ffaPlayerDelete", eventd => {
    blobs.splice(blobs.findIndex(v => v.owner === eventd), 1);
});
socket.on("ffaLoginFailed", str => alert(str));
socket.on("ffaPlayerUpdate", async eventd => {
    for (const player of eventd) {
        if (player.owner !== ownBlob.owner) {
            if (blobs.some(v => v.owner === player.owner)) {
                blobs[blobs.findIndex(v => v.owner === player.owner)].x = player.x;
                blobs[blobs.findIndex(v => v.owner === player.owner)].y = player.y;
                blobs[blobs.findIndex(v => v.owner === player.owner)].br = player.br;
            } else {
                const n = new BlobObj(player.br, player.owner, player.x, player.y);
                await n.setBlob();
                n.display(true, true);
                blobs.push(n);
            }
        }
    }
    blobs = blobs.filter(v => blobs.filter(vv => vv.owner === v.owner).length < 2);
});
socket.on("ffaObjectsHeartbeat", eventd => {
    for (let i = 0; i < eventd.walls.length; ++i) {
        const wall = new WallObj(eventd.walls[i].x, eventd.walls[i].y);
    }
});
socket.on("ffaHeartbeat", d => {
    ownBlob.owner = d.username;
    ownBlob.br = d.br;
    ownBlob.ready = true;
    blobs.push(ownBlob);
});
socket.on("ffaUnauthorized", () => document.location.href = "/login/");
socket.emit("ffaPlayerCreate", sessionid.substr(sessionid.indexOf("=") + 1));


// Events (Window/Document)
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth - 30;
    canvas.height = window.innerHeight - 30;
});

document.addEventListener("keydown", eventd => {
    switch (eventd.keyCode) {
        case 13: // newline
            ownBlob.direction = 4;
            break;
        case 87: // w
            ownBlob.direction = 0;
            break;
        case 68: // d
            ownBlob.direction = 1;
            break;
        case 83: // s
            ownBlob.direction = 2;
            break;
        case 65: // a
            ownBlob.direction = 3;
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
    const [event] = eventd;
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
