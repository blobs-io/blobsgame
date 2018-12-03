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

function displayLeaderboard() {
    document.getElementById("leaderboard").innerHTML = "<h3>Leaderboard</h3>";
    const sortedblobs = blobs.slice(0, 10).sort((a, b) => b.br > a.br);
    for (let i = 0; i < sortedblobs.length; ++i) {
        const tier = getTier(sortedblobs[i].br || 0);
        const leaderboardEntry = document.createElement("div");
        const usernameEntry = document.createElement("span");
        const brLabel = document.createElement("span");
        leaderboardEntry.className = "leaderboard-entry";
        usernameEntry.className = "user-entry";
        usernameEntry.innerHTML = (i + 1) + ". " + sortedblobs[i].owner.substr(0, 12);
        brLabel.className = "user-br";
        brLabel.innerHTML = sortedblobs[i].br + " BR";
        document.getElementById("leaderboard").appendChild(leaderboardEntry);
        document.getElementById("leaderboard").appendChild(usernameEntry);
        document.getElementById("leaderboard").appendChild(brLabel);
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
    context.fillText(`X: ${Math.floor(ownBlob.x)} | Y: ${Math.floor(ownBlob.y)}`, canvas.width - 90, canvas.height - 20);
    context.fillText(`BR: ${ownBlob.br}`, canvas.width - 90, canvas.height - 40);
}

function drawBorder(context = ctx) {
    context.strokeStyle = "white";
    const diffXPos = ownBlob.x + (canvas.width / 2);
    const diffXNeg = ownBlob.x - (canvas.width / 2);
    const diffYPos = ownBlob.y + (canvas.height / 2);
    const diffYNeg = ownBlob.y - (canvas.height / 2);
    if (diffXPos > mapSize.width) { // right border
        context.beginPath();
        context.moveTo((canvas.width - (diffXPos - mapSize.width)), (diffYNeg < 0 ? -(diffYNeg + 35) : 0));
        context.lineTo((canvas.width - (diffXPos - mapSize.width)), (diffYPos > mapSize.height ? canvas.height - (diffYPos - mapSize.height) : canvas.height));
        context.stroke();
    }
    if (diffXNeg < 0) { // left border
        context.beginPath();
        context.moveTo((-(diffXNeg + 35)), (diffYNeg < 0 ? -(diffYNeg + 35) : 0));
        context.lineTo((-(diffXNeg + 35)), (diffYPos > mapSize.height ? canvas.height - (diffYPos - mapSize.height) : canvas.height));
        context.stroke();
    }
    if (diffYPos > mapSize.height) { // bottom border
        context.beginPath();
        context.moveTo((diffXNeg < 0 ? -(diffXNeg + 35) : 0), (canvas.height - (diffYPos - mapSize.height)));
        context.lineTo((diffXPos > mapSize.width ? canvas.width - (diffXPos - mapSize.width) : canvas.width), (canvas.height - (diffYPos - mapSize.height)));
        context.stroke();
    }
    if (diffYNeg < 0) { // top border
        context.beginPath();
        context.moveTo((diffXNeg < 0 ? -(diffXNeg + 35) : 0), (-(diffYNeg + 35)));
        context.lineTo((diffXPos > mapSize.width ? canvas.width - (diffXPos - mapSize.width) : canvas.width), (-(diffYNeg + 35)));
        context.stroke();
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
