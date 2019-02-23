// Utilities
function displayUI(excludes = []) {
    if (!excludes.includes("clearCanvas")) clearCanvas();
    if (!excludes.includes("drawBorder")) drawBorder();
    if (!excludes.includes("displayCooldown")) displayCooldown();
    if (!excludes.includes("displayPlayerStats")) displayPlayerStats();
    if (!excludes.includes("displayWalls")) displayWalls();
    if (!excludes.includes("displayNoNomAreas")) displayNoNomAreas();
    if (!excludes.includes("displayHP")) displayHP();
    if (!excludes.includes("BlobObjDisplay")) BlobObj.display(blobs, true, true);
}

function displayHP(context = ctx) {
    context.font = "50px Raleway";

    if (ownBlob.health >= 80) context.fillStyle = "#2ecc71";
    else if (ownBlob.health >= 50) context.fillStyle = "#f39c12";
    else if (ownBlob.health >= 30) context.fillStyle = "#e67e22";
    else if (ownBlob.health >= 10) context.fillStyle = "#e74c3c";
    else context.fillStyle = "#c0392b";

    context.fillText(ownBlob.health, canvas.width - 120, canvas.height - 20);
    context.font = "20px Raleway";
    context.fillText("HP", canvas.width - 35, canvas.height - 20);
    context.fillStyle = "white";
    window.requestAnimationFrame(draw);
}

function displayNoNomAreas(context = ctx) {
    for (let i = 0; i < objects.noNomAreas.length; ++i) {
        let canvasPosX = 0,
            canvasPosY = 0;
        if (ownBlob.x >= objects.noNomAreas[i].startsAt.x) {
            canvasPosX = (canvas.width / 2) - (ownBlob.x - objects.noNomAreas[i].startsAt.x);
        } else if (ownBlob.x < objects.noNomAreas[i].startsAt.x) {
            canvasPosX = (canvas.width / 2) + (objects.noNomAreas[i].startsAt.x - ownBlob.x);
        }
        if (ownBlob.y >= objects.noNomAreas[i].startsAt.y) {
            canvasPosY = (canvas.height / 2) - (ownBlob.y - objects.noNomAreas[i].startsAt.y);
        } else if (ownBlob.y < objects.noNomAreas[i].startsAt.y) {
            canvasPosY = (canvas.height / 2) + (objects.noNomAreas[i].startsAt.y - ownBlob.y);
        }
        canvasPosX -= 35;
        canvasPosY -= 35;
        NoNomArea.display({ x: canvasPosX, y: canvasPosY }, { x: Math.abs(objects.noNomAreas[i].startsAt.x - objects.noNomAreas[i].endsAt.x), y: Math.abs(objects.noNomAreas[i].startsAt.y - objects.noNomAreas[i].endsAt.y) });
    }
}

function clearCanvas(context = ctx) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function displayLeaderboard() {
	const placementColors = ["#e74c3c", "#e67e22", "#9b59b6", "#3498db", "#2980b9", "#2ecc71", "#f1c40f", "#d35400", "#8e44ad", "#16a085"];
    document.getElementById("leaderboard").innerHTML = "<h3>Leaderboard</h3>";
    const sortedblobs = blobs.slice(0, 10).sort((a, b) => b.br - a.br);
    for (let i = 0; i < sortedblobs.length; ++i) {
        const tier = getTier(sortedblobs[i].br || 0);
        const leaderboardEntry = document.createElement("div");
		const usernameEntry = document.createElement("span");
		usernameEntry.style.color = placementColors[i];
        const brLabel = document.createElement("span");
		brLabel.style.color = placementColors[i];
		const linebreak = document.createElement("br");
        leaderboardEntry.className = "leaderboard-entry";
        usernameEntry.className = "user-entry";
        usernameEntry.innerHTML = (i + 1) + ". " + sortedblobs[i].owner.substr(0, 12);
        brLabel.className = "user-br";
        brLabel.innerHTML = sortedblobs[i].br + " BR";
        document.getElementById("leaderboard").appendChild(leaderboardEntry);
        document.getElementById("leaderboard").appendChild(usernameEntry);
        document.getElementById("leaderboard").appendChild(brLabel);
        document.getElementById("leaderboard").appendChild(linebreak);
    }
}

function displayWalls(context = ctx) {
    for (let i = 0; i < objects.walls.length; ++i) {
        let canvasPosX = 0,
        canvasPosY = 0;
        if (ownBlob.x >= objects.walls[i].x) {
            canvasPosX = (canvas.width / 2) - (ownBlob.x - objects.walls[i].x);
        } else if (ownBlob.x < objects.walls[i].x) {
            canvasPosX = (canvas.width / 2) + (objects.walls[i].x - ownBlob.x);
        }
        if (ownBlob.y >= objects.walls[i].y) {
            canvasPosY = (canvas.height / 2) - (ownBlob.y - objects.walls[i].y);
        } else if (ownBlob.y < objects.walls[i].y) {
            canvasPosY = (canvas.height / 2) + (objects.walls[i].y - ownBlob.y);
        }
        canvasPosY -= 45;
        canvasPosX -= 45;
        context.drawImage(objects.images.brickwall, canvasPosX, canvasPosY, 45, 45);
    }
}

function displayCooldown(context = ctx) {
    if (document.getElementById("cooldown-timer") != null) {
        document.getElementById("nom-cooldown").removeChild(document.getElementById("cooldown-timer"));
    }

    const timerElement = document.createElement("span");
    const nomReady = Date.now() - ownBlob.lastnom > 1500;
    timerElement.id = "cooldown-timer";
    timerElement.innerHTML = !nomReady ? `${((1500 - (Date.now() - ownBlob.lastnom)) / 1000).toFixed(1)}s` : "Ready";
    document.getElementById("nom-cooldown").appendChild(timerElement);
}

function displayPlayerStats(context = ctx) {
    context.font = "15px Dosis";
    context.fillText(`X: ${Math.floor(ownBlob.x)} | Y: ${Math.floor(ownBlob.y)}`, canvas.width - 80, canvas.height);
}

function drawBorder(context = ctx) {
    context.beginPath();
    context.strokeStyle = "white";
    const diffXPos = ownBlob.x + (canvas.width / 2);
    const diffXNeg = ownBlob.x - (canvas.width / 2);
    const diffYPos = ownBlob.y + (canvas.height / 2);
    const diffYNeg = ownBlob.y - (canvas.height / 2);
    if (diffXPos > mapSize.width) { // right border
        context.beginPath();
        context.moveTo(border.right.from.x = (canvas.width - (diffXPos - mapSize.width)), border.right.from.y = (diffYNeg < 0 ? -(diffYNeg + 35) : 0));
        context.lineTo(border.right.to.x = (canvas.width - (diffXPos - mapSize.width)), border.right.to.y = (diffYPos > mapSize.height ? canvas.height - (diffYPos - mapSize.height) : canvas.height));
        context.closePath();
        context.stroke();
    } else if(border.right.from.x !== 0 || border.right.from.y !== 0 || border.right.to.x !== 0 || border.right.to.y !== 0) {
        border.right.from.x = border.right.from.y = border.right.to.x = border.right.to.y = 0;
    }
    if (diffXNeg < 0) { // left border
        context.beginPath();
        context.moveTo(border.left.from.x = (-(diffXNeg + 35)), border.left.from.y = (diffYNeg < 0 ? -(diffYNeg + 35) : 0));
        context.lineTo(border.left.to.x = (-(diffXNeg + 35)), border.left.to.y = (diffYPos > mapSize.height ? canvas.height - (diffYPos - mapSize.height) : canvas.height));
        context.closePath();
        context.stroke();
    } else if(border.left.from.x !== 0 || border.left.from.y !== 0 || border.left.to.x !== 0 || border.left.to.y !== 0) {
        border.left.from.x = border.left.from.y = border.left.to.x = border.left.to.y = 0;
    }
    if (diffYPos > mapSize.height) { // bottom border
        context.beginPath();
        context.moveTo(border.bottom.from.x = (diffXNeg < 0 ? -(diffXNeg + 35) : 0), border.bottom.from.y = (canvas.height - (diffYPos - mapSize.height)));
        context.lineTo(border.bottom.to.x = (diffXPos > mapSize.width ? canvas.width - (diffXPos - mapSize.width) : canvas.width), border.bottom.to.y = (canvas.height - (diffYPos - mapSize.height)));
        context.closePath();
        context.stroke();
    } else if(border.bottom.from.x !== 0 || border.bottom.from.y !== 0 || border.bottom.to.x !== 0 || border.bottom.to.y !== 0) {
        border.bottom.from.x = border.bottom.from.y = border.bottom.to.x = border.bottom.to.y = 0;
    }
    if (diffYNeg < 0) { // top border
        context.beginPath();
        context.moveTo(border.top.from.x = (diffXNeg < 0 ? -(diffXNeg + 35) : 0), border.top.from.y = (-(diffYNeg + 35)));
        context.lineTo(border.top.to.x = (diffXPos > mapSize.width ? canvas.width - (diffXPos - mapSize.width) : canvas.width), border.top.to.y = (-(diffYNeg + 35)));
        context.closePath();
        context.stroke();
    } else if(border.top.from.x !== 0 || border.top.from.y !== 0 || border.top.to.x !== 0 || border.top.to.y !== 0) {
        border.top.from.x = border.top.from.y = border.top.to.x = border.top.to.y = 0;
    }
}

function getTier(br) {
    let result = {};
    if (br >= 0 && br < 1500) {
        result.tier = "bronze";
        result.colorCode = "b57156";
        result.emblemFile = "emblem_bronze.png";
    } else if (br >= 1500 && br < 3000) {
        result.tier = "silver";
        result.colorCode = "dbdbdb";
        result.emblemFile = "emblem_silver.png";
    } else if (br >= 3000 && br < 5000) {
        result.tier = "platinum";
        result.colorCode = "E5E4E2";
        result.emblemFile = "emblem_platinum.png";
    } else if (br >= 5000 && br < 8000) {
        result.tier = "gold";
        result.colorCode = "D7AF00";
        result.emblemFile = "emblem_gold.png";
    } else if (br >= 8000 && br < 9500) {
        result.tier = "diamond";
        result.colorCode = "16f7ef";
        result.emblemFile = "emblem_diamond.png";
    } else if (br >= 9500 && br < 10000) {
        result.tier = "painite";
        result.colorCode = "16f77f";
        result.emblemFile = "emblem_painite.png";
    }
    return result;
}

function nom(attackBlob, target) {
    if (attackBlob.x < (target.x + 30) && attackBlob.x > (target.x - 30)) {
        if (attackBlob.y < (target.y + 30) && attackBlob.y > (target.y - 30)) {

            target.health -= Math.floor(Math.random() * 10) + 30;
            if (target.health <= 0) {
                socket.emit("singleplayerNomKey", { attackBlob, target });
                target.health = 100;
            }
        }
    }
}

function getTierByName(name) {
	switch (name) {
		case "bronze": return getTier(1000); break;
		case "silver": return getTier(2000); break;
		case "platinum": return getTier(3500); break;
		case "gold": return getTier(5500); break;
		case "diamond": return getTier(8500); break;
		case "painite": return getTier(9999); break;
	}
}
