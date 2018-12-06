const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");
const sessionid = (window.location.search.match(/[\?\&]sid=[^\&]{12,20}/) || [""])[0];
let lastLeaderboardUpdate = Date.now();
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
const border = {
	left: { x: 0, y: 0 },
	right: { x: 0, y: 0},
	bottom: { x: 0, y: 0 },
	top: { x: 0, y: 0 }
};
const emblems = {
    bronze: (() => { const image = new Image(); image.src = "../../assets/emblems/emblem_bronze.png"; return image; })(),
    silver: (() => { const image = new Image(); image.src = "../../assets/emblems/emblem_silver.png"; return image; })(),
    platinum: (() => { const image = new Image(); image.src = "../../assets/emblems/emblem_platinum.png"; return image; })(),
    gold: (() => { const image = new Image(); image.src = "../../assets/emblems/emblem_gold.png"; return image; })(),
    diamond: (() => { const image = new Image(); image.src = "../../assets/emblems/emblem_diamond.png"; return image; })(),
    painite: (() => { const image = new Image(); image.src = "../../assets/emblems/emblem_painite.png"; return image; })(),
    guest: (() => { const image = new Image(); image.src = "../../assets/emblems/emblem_guest-or-unknown.png"; return image; })(),
    admin: (() => { const image = new Image(); image.src = "../../assets/emblems/emblem_admin.png"; return image; })(),
};
	
	
canvas.width = window.innerWidth - 30;
canvas.height = window.innerHeight - 30;

// Coordinate updates
setInterval(() => {
    if (ownBlob.ready === false) return;
    if (Date.now() - lastLeaderboardUpdate > 1500) displayLeaderboard();
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
    displayLeaderboard();
    blobs[blobs.findIndex(v => v.owner === eventd.loser.owner)].br = eventd.loser.br;
    blobs[blobs.findIndex(v => v.owner === eventd.winner.owner)].br = eventd.winner.br;
    if (eventd.loser.owner === ownBlob.owner) {
        ownBlob.x = eventd.loser.x;
        ownBlob.y = eventd.loser.y;
    }
});
