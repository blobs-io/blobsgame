async function showOverview(guest, rest) {
    function stateToString(state) {
        if (state === 0) return "Waiting...";
        else if (state === 1) return "Countdown";
        else if (state === 2) return "Ingame";
    }
    function stateToClass(state) {
        if (state === 0) return "state-waiting";
        else if (state === 1) return "state-countdown";
        else if (state === 2) return "state-ingame";
    }
    const rooms = await rest.fetchRooms();
    const roomOverview = document.createElement("div"),
        closeBtn = document.createElement("button"),
        overviewHeader = document.createElement("span");
    roomOverview.id = "room-overview";
    closeBtn.id = "close-btn";
    closeBtn.className = "btn";
    closeBtn.innerText = "Close";
    overviewHeader.className = "heading med-text";
    overviewHeader.innerText = "Room Overview";

    closeBtn.onclick = () => {
        document.body.removeChild(roomOverview);
    };

    roomOverview.appendChild(closeBtn);
    roomOverview.appendChild(overviewHeader);

    for (const room of rooms) {
        const roomEntry = document.createElement("div"),
            roomLabel = document.createElement("span"),
            roomName = document.createElement("span"),
            playerCount = document.createElement("span"),
            stateEl = document.createElement("span"),
            joinLink = document.createElement("a");
        roomEntry.className = "room-entry";
        roomLabel.className = "room-label label-" + room.mode;
        roomLabel.innerText = room.mode.toUpperCase();
        roomName.className = "room-name";
        roomName.innerText = room.id.toUpperCase();
        playerCount.className = "player-count";
        playerCount.innerText = `${room.players.length}/100 players`;
        stateEl.className = "room-state " + (room.state ? stateToClass(room.state) : "state-waiting");
        stateEl.innerText = (room.state ? stateToString(room.state) : "Open") + " ".repeat(4);
        joinLink.href = "/game?mode=" + room.mode + "&id=" + room.id + (guest === true ? "&guest=true" : "");
        joinLink.className = "join-link";
        joinLink.innerText = "Join";

        roomEntry.appendChild(roomLabel);
        roomEntry.appendChild(roomName);
        roomEntry.appendChild(playerCount);
        roomEntry.appendChild(stateEl);
        roomEntry.appendChild(joinLink);
        roomOverview.appendChild(roomEntry);
    }
            
    document.body.appendChild(roomOverview);
}
