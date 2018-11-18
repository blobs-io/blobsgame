const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");
const host = "localhost:3000";
const socket = io.connect(host);
const sessionid = (window.location.search.match(/[\?\&]sid=[^\&]{12,20}/) || [""])[0];
let blobs = [],
objects = {
    walls: [],
    images: {
		blobnom: null
	}
};
var scale = 1;
const mapSize = {
	width: 2000,
	height: 2000
};
	
	
canvas.width = window.innerWidth - 30;
canvas.height = window.innerHeight - 30;

// Coordinate updates
setInterval(() => {
    if (ownBlob.ready === false) return;
    if (ownBlob.x <= 1 && ownBlob.direction === 3) return displayUI();
    else if (ownBlob.y <= 1 && ownBlob.direction === 0) return displayUI();
    else if (ownBlob.y >= mapSize.height && ownBlob.direction === 2) return displayUI();
    else if (ownBlob.x >= mapSize.width && ownBlob.direction === 1) return displayUI();

    if (ownBlob.direction === 0) ownBlob.y = ownBlob.directionChangeCoordinates.y - (1.025 * ((Date.now() - ownBlob.directionChangedAt) / 20));
    else if (ownBlob.direction === 1) ownBlob.x = ownBlob.directionChangeCoordinates.x + (1.025 * ((Date.now() - ownBlob.directionChangedAt) / 20));
    else if (ownBlob.direction === 2) ownBlob.y = ownBlob.directionChangeCoordinates.y + (1.025 * ((Date.now() - ownBlob.directionChangedAt) / 20));
    else if (ownBlob.direction === 3) ownBlob.x = ownBlob.directionChangeCoordinates.x - (1.025 * ((Date.now() - ownBlob.directionChangedAt) / 20));
    displayUI();
    socket.emit("ffaCoordinateChange", ownBlob);
}, 1);

socket.on("ffaPlayerNommed", eventd => {
    blobs[blobs.findIndex(v => v.owner === eventd.loser.owner)].br = eventd.loser.br;
    blobs[blobs.findIndex(v => v.owner === eventd.winner.owner)].br = eventd.winner.br;
    if (eventd.loser.owner === ownBlob.owner) {
        ownBlob.x = eventd.loser.x;
        ownBlob.y = eventd.loser.y;
    }
});
