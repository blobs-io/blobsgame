function showOverview() {
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
    function idtoType(id) {
        if (id.startsWith("ffa")) return "ffa";
        else if (id.startsWith("elim")) return "elimination";
        else return "";
    }
    const xml = new XMLHttpRequest();
    xml.open("GET", "http://localhost/api/rooms", true);
    xml.onload = () => {
        if (xml.readyState === 4 && xml.status === 200) {
            const rooms = JSON.parse(xml.responseText);
            const roomOverview = document.createElement("div"),
                  closeBtn = document.createElement("button"),
                  overviewHeader = document.createElement("span");
            roomOverview.id = "room-overview";
            closeBtn.id = "close-btn"
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
                      roomName = document.createElement("span"),
                      playerCount = document.createElement("span"),
                      stateEl = document.createElement("span"),
                      joinLink = document.createElement("a");
                roomEntry.className = "room-entry";
                roomName.className = "room-name";
                roomName.innerText = room.id.toUpperCase();
                playerCount.className = "player-count";
                playerCount.innerText = `${room.players.length}/100 players`;
                stateEl.className = "room-state " + (room.state ? stateToClass(room.state) : "state-waiting");
                stateEl.innerText = (room.state ? stateToString(room.state) : "Open") + " ".repeat(4);
                joinLink.href = "/game?mode=" + idtoType(room.id) + "&id=" + room.id + "&guest=true";
                joinLink.innerText = "Join";

                roomEntry.appendChild(roomName);
                roomEntry.appendChild(playerCount);
                roomEntry.appendChild(stateEl);
                roomEntry.appendChild(joinLink);
                roomOverview.appendChild(roomEntry);
            }
            
            document.body.appendChild(roomOverview);
        }
    };
    xml.send();
}