// Utilities
function displayUI(excludes = []) {
    if (!excludes.includes("clearCanvas")) clearCanvas();
    if (!excludes.includes("drawBorder")) drawBorder();
    if (!excludes.includes("BlobObjDisplay")) BlobObj.display(blobs, true, true);
    if (!excludes.includes("displayLeaderboard")) displayLeaderboard();
    if (!excludes.includes("displayCooldown")) displayCooldown();
    if (!excludes.includes("displayPlayerStats")) displayPlayerStats();
}

function clearCanvas(context = ctx) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function displayLeaderboard(context = ctx) {
    context.strokeStyle = "white";
    context.fillStyle = "white";
    context.fillRect(canvas.width - 135, 0, 130, (blobs.length * 20) + 40);
    context.fillStyle = "black";
    context.font = "14px Dosis";
    context.fillText("Leaderboard", canvas.width - 100, 15);
    context.rect(canvas.width - 135, 20, 100, .1);
    const sortedblobs = blobs.slice(0, 10).sort((a, b) => b.br > a.br);
    context.font = "13px Dosis";
    context.fillStyle = "black";
    for (let i = 0; i < sortedblobs.length; ++i) {
        context.fillText(sortedblobs[i].owner.substr(0, 12), canvas.width - 125, 22 + (12 * (i + 1)));
        context.fillText(sortedblobs[i].br + " BR", canvas.width - 60, 22 + (12 * (i + 1)));
    }
    context.stroke();
}
// not yet
function displayWalls() {
    for (const wall of objects.walls) {
        wall.display();
    }
}

function displayCooldown(context = ctx) {
    context.beginPath();
    context.strokeRect(canvas.width - 135, (blobs.length * 20) + 60, 135, 25);
    context.fillStyle = "white";
    const nomReady = Date.now() - ownBlob.lastnom > 1500;
    context.fillText(!nomReady ? `${((1500 - (Date.now() - ownBlob.lastnom)) / 1000).toFixed(0)}s` : "ready", nomReady ? canvas.width - 100 : canvas.width - 90, (blobs.length * 20) + 60 + 16);
    if (objects.images.blobnom._ready) {
        context.drawImage(objects.images.blobnom, canvas.width - 130, (blobs.length * 20) + 63, 20, 20);
    }
    context.stroke();
}

function displayPlayerStats(context = ctx) {
    context.font = "15px Dosis";
    context.fillText(`X: ${Math.floor(ownBlob.x)} | Y: ${Math.floor(ownBlob.y)}`, canvas.width - 90, canvas.height - 20);
    context.fillText(`BR: ${ownBlob.br}`, canvas.width - 90, canvas.height - 40);
}

function drawBorder(context = ctx) {
    const diffXPos = ownBlob.x + (canvas.width / 2);
    const diffXNeg = ownBlob.x - (canvas.width / 2);
    const diffYPos = ownBlob.y + (canvas.height / 2);
    const diffYNeg = ownBlob.y - (canvas.height / 2);
    if (diffXPos > mapSize.width) {
        context.beginPath();
        context.moveTo((canvas.width - (diffXPos - mapSize.width)) * scale, (diffYNeg < 0 ? -(diffYNeg + 35) : 0) * scale);
        context.lineTo((canvas.width - (diffXPos - mapSize.width)) * scale, (diffYPos > mapSize.height ? canvas.height - (diffYPos - mapSize.height) : canvas.height) * scale);
        context.stroke();
    }
    if (diffXNeg < 0) {
        context.beginPath();
        context.moveTo((-(diffXNeg + 35)) * scale, (diffYNeg < 0 ? -(diffYNeg + 35) : 0) * scale);
        context.lineTo((-(diffXNeg + 35)) * scale, (diffYPos > mapSize.height ? canvas.height - (diffYPos - mapSize.height) : canvas.height) * scale);
        context.stroke();
    }
    if (diffYPos > mapSize.height) {
        context.beginPath();
        context.moveTo((diffXNeg < 0 ? -(diffXNeg + 35) : 0) * scale, (canvas.height - (diffYPos - mapSize.height)) * scale);
        context.lineTo((diffXPos > mapSize.width ? canvas.width - (diffXPos - mapSize.width) : canvas.width) * scale, (canvas.height - (diffYPos - mapSize.height)) * scale);
        context.stroke();
    }
    if (diffYNeg < 0) {
        context.beginPath();
        context.moveTo((diffXNeg < 0 ? -(diffXNeg + 35) : 0) * scale, (-(diffYNeg + 35)) * scale);
        context.lineTo((diffXPos > mapSize.width ? canvas.width - (diffXPos - mapSize.width) : canvas.width) * scale, (-(diffYNeg + 35)) * scale);
        context.stroke();
    }
}

function getTier(br) {
	let result = {};
	if (br >= 0 && br < 1500) {
		result.tier = "bronze";
		result.colorCode = "b57156";
	} else if (br >= 1500 && br < 5000) {
		result.tier = "silver";
		result.colorCode = "dbdbdb";
	} else if (br >= 5000 && br < 8000) {
		result.tier = "gold";
		result.colorCode = "D7AF00";
	} else if (br >= 8000 && br < 9500) {
		result.tier = "diamond";
		result.colorCode = "16f7ef";
	} else if (br >= 9500 && br < 10000) {
		result.tier = "master";
		result.colorCode = "16f77f";
	}
	return result;
}
