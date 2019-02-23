const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");
const sessionid = (() => {
    const cookie = document.cookie.split(/; */).find(v => v.startsWith("session=")) || "";
    return cookie.substr(cookie.indexOf("=") + 1);
})();
let lastTick = Date.now();
let blobs = [],
objects = {
	walls: [],
	images: {
		blobnom: null,
		brickwall: (() => { const image = new Image(); image.src = "../../assets/brickwall.png"; return image; })()
	}
};
var scale = 1;
const mapSize = {
	width: 2000,
	height: 2000
};
const border = {
	left: { from: { x: 0, y: 0,}, to: { x: 0, y: 0 } },
	right: { from: { x: 0, y: 0,}, to: { x: 0, y: 0 } },
	top: { from: { x: 0, y: 0,}, to: { x: 0, y: 0 } },
	bottom: { from: { x: 0, y: 0,}, to: { x: 0, y: 0 } }
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
const details = {
	mode: "FFA",
	singleplayer: false
};
let ping = 0;

canvas.width = window.innerWidth - 30;
canvas.height = window.innerHeight - 30;

function draw() {
    // FPS meter
    if(Date.now() - lastIteration > 100) document.getElementById("fps-meter").innerHTML = `${(10000 / (Date.now() - lastIteration)).toFixed(1)} FPS`;
    lastIteration = Date.now();
    // Blob coordinates
    if (typeof ownBlob === "undefined") return window.requestAnimationFrame(draw);
    if (ownBlob.ready === false) return window.requestAnimationFrame(draw);
    if (Date.now() - lastTick > 2500) {
        if (details.singleplayer === true) {
            for (let i = 0; i < blobs.length; ++i) {
                if (blobs[i].owner !== ownBlob.owner) {} //decide(blobs[i]);
            }
        }
        displayLeaderboard();
        const timestampBefore = Date.now();
        request("/api/ping", "GET").then(res => {
            const request = JSON.parse(res.responseText);
            const diff = ping = (Date.now() - timestampBefore);
            document.getElementById("latency").innerHTML = `Ping: <span style="color: #${diff < 10 ? '00ff00' : (diff < 30 ? 'ccff99' : (diff < 50 ? 'ffff99': (diff < 100 ? 'ff9966' : 'ff0000')))}">${diff}ms</span>`;
        });
        if (details.singleplayer === false) {
            request("/api/ffa/players", "GET").then(res => {
                const request = JSON.parse(res.responseText);
                for (const blob of request) {
                    const target = blobs[blobs.findIndex(v => v.owner === blob.owner)];
                    target.directionChangeCoordinates = blob.directionChangeCoordinates;
                    target.directionChangedAt = blob.directionChangedAt;
                }
            });
        }

        lastTick = Date.now();
    }
    if (ownBlob.x <= 1 && ownBlob.direction === 3) return displayUI();
    else if (ownBlob.y <= 1 && ownBlob.direction === 0) return displayUI();
    else if (ownBlob.y >= mapSize.height && ownBlob.direction === 2) return displayUI();
    else if (ownBlob.x >= mapSize.width && ownBlob.direction === 1) return displayUI();
    displayUI();
}

// Coordinate updates
let lastIteration = Date.now();
window.requestAnimationFrame(draw);

socket.on("ffaPlayerNommed", eventd => {
    displayLeaderboard();
    blobs[blobs.findIndex(v => v.owner === eventd.loser.owner)].br = eventd.loser.br;
    blobs[blobs.findIndex(v => v.owner === eventd.winner.owner)].br = eventd.winner.br;
    blobs[blobs.findIndex(v => v.owner === eventd.loser.owner)].directionChangeCoordinates.x = eventd.loser.directionChangeCoordinates.x;
    blobs[blobs.findIndex(v => v.owner === eventd.loser.owner)].directionChangeCoordinates.y = eventd.loser.directionChangeCoordinates.y;
    blobs[blobs.findIndex(v => v.owner === eventd.loser.owner)].directionChangedAt = eventd.loser.directionChangedAt;

    blobs[blobs.findIndex(v => v.owner === eventd.loser.owner)].health = 100;

	const nomHistoryDiv = document.getElementById("nom-hist");
	const nomEntryDiv = document.createElement("div");
	nomEntryDiv.className = "nom-hist-entry";
	const nomUser = document.createElement("span");
	const targetUser = document.createElement("span");
	nomUser.className = "nom-user nom-entry";
	nomUser.innerHTML = `${eventd.winner.owner} (+${eventd.result})`;
	const newBRLabel = document.createElement("span");
	const newBRLabelLoser = document.createElement("span");
	newBRLabel.className = "new-br";
	newBRLabel.innerHTML = eventd.winner.br + " BR";
	const linebreakWinner = document.createElement("br");
	targetUser.className = "target-user nom-entry";
	targetUser.innerHTML = `${eventd.loser.owner} (-${eventd.result})`;
	newBRLabelLoser.className = "new-br";
	newBRLabelLoser.innerHTML = eventd.loser.br + " BR";
	const linebreakLoser = document.createElement("br");
	nomHistoryDiv.appendChild(nomEntryDiv);
	nomEntryDiv.appendChild(nomUser);
	nomEntryDiv.appendChild(newBRLabel);
	nomEntryDiv.appendChild(linebreakWinner);
	nomEntryDiv.appendChild(targetUser);
	nomEntryDiv.appendChild(newBRLabelLoser);
	nomEntryDiv.appendChild(linebreakLoser);
	
	setTimeout(() => {
		nomHistoryDiv.removeChild(nomEntryDiv);
	}, 3500);
});
