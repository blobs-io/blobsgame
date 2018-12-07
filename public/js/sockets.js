const server = document.location.href.match(/https?:\/\/[^\/]+/)[0];
const socket = io.connect(server);
const message = "<div id=\"<type>-notif\"><message></div>";
let buttonClicked = false;

// WS Info label
(() => {
	const wsinfodiv = document.createElement("div");
	wsinfodiv.id = "wsinfo";
	wsinfodiv.innerHTML = "Connecting to server ...";
	document.body.prepend(wsinfodiv);

    socket.on("connect", () => {
        document.body.removeChild(document.getElementById("wsinfo"));
    });
})();

socket.on("disconnect", () => {
    const wsinfodiv = document.createElement("div");
    wsinfodiv.id = "wsinfo";
    wsinfodiv.innerHTML = "Connection lost.";
    wsinfodiv.style.color = "red";
    document.body.prepend(wsinfodiv);
});

if (/register(\/.*)?$/.test(window.location.href)) {
    socket.emit("getCaptcha");
    socket.on("captcha", function (data) {
        const ctx = document.getElementsByTagName("canvas")[0].getContext("2d");
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(data.captcha, data.position.x, data.position.y);
    });

    document.getElementById("register-btn").addEventListener("click", function () {
		if (buttonClicked === true) return;
        socket.emit("register", {
            username: document.getElementById("user").value,
            password: document.getElementById("pass").value,
            captcha: document.getElementById("captcha-input").value
        });
    });
	
	document.getElementById("guest-btn").addEventListener("click", function(data) {
	    document.location.href = "/game?guest=true";
    });

    socket.on("register", function (data) {
        const element = document.createElement("div");
        if (document.getElementById("failure-notif")) {
            document.getElementById("auth").removeChild(document.getElementById("failure-notif"));
        }
        if ([400, 500].indexOf(data.status) > -1) {
            element.id = "failure-notif";
            element.innerHTML = data.message;
            document.getElementById("auth").prepend(element);
        } else {
			buttonClicked = true;
            if (document.getElementById("success-notif")) {
                document.getElementById("auth").removeChild(document.getElementById("success-notif"));
            }
            document.getElementById("auth").innerHTML = message.replace("<type>", "success").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
        }
    });
} else if (/login(\/.*)?$/.test(window.location.href)) {
	// Browser detection test
	if (/(Android|webOS|iPad|iPod|Windows Phone|BlackBerry|iPhone)/.test(navigator.userAgent)) {
		const noteElement = document.createElement("div");
		noteElement.id = "failure-notif";
		noteElement.innerHTML = "Mobile support for Blobs.io is currently experimental and may not work. <a href=\"https://github.com/blobs-io/blobs.io/issues/new/choose\">Open an issue</a> if you experience problems.";
		document.body.insertBefore(noteElement, document.body.firstChild);
	}
	document.getElementById("guest-btn").addEventListener("click", function(data) {
	    document.location.href = "/game?guest=true";
    });
    document.getElementById("login-btn").addEventListener("click", function (data) {
		if (buttonClicked === true) return;
        socket.emit("login", {
            username: document.getElementById("user").value,
            password: document.getElementById("pass").value
        });
        socket.on("login", function (data) {
            if ([400, 403, 500].indexOf(data.status) > -1) {
                document.getElementById("auth").innerHTML = message.replace("<type>", "failure").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
            } else {
				buttonClicked = true;
                document.getElementById("auth").innerHTML = message.replace("<type>", "success").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
                if (typeof data.session_id !== "undefined") document.location.href = server + "/app?sessionid=" + data.session_id;
            }
        });
    });
    socket.emit("requestOnlineCount");
    socket.on("onlineCount", r => {
		const userCountElement = document.createElement("span");
		userCountElement.className = "online-count";
		userCountElement.innerHTML = `${r} online`;
		document.getElementById("auth").appendChild(userCountElement);
	});
} else if (/app(\/.*)?/.test(window.location.href)) {
    const blobs = {
		current: undefined,
		all: undefined
	};
    var ready = false;
    const sessionid = (window.location.search.match(/[\?\&]sessionid=[^\&]{12,20}/) || []);
    if (sessionid.length > 0) {
        socket.emit("appCreate", sessionid[0].substr(sessionid[0].indexOf("=") + 1));
        socket.on("appCreate", async function (data) {
            if (data.status != 200) {
                console.error(JSON.stringify(data));
                return document.location.href = "/login/";
            } else ready = true;
            if (data.role === 1) document.getElementById("query-btn").style.display = "inline";
            // Stats
            const tier = getTier(data.br || 0);
            document.getElementById("br-label").innerHTML = `${data.br} BR (<span style="color: #${tier.colorCode}">${tier.tier}</span>)`;
            document.getElementById("blobcoins-label").innerHTML = `Blobcoins: ${data.coins}`;
            document.getElementById("distance-label").innerHTML = `Distance travelled: ${data.distance}K pixels`;
            // Blob list
            blobs.current = data.activeBlob;
            const activeBlobElements = {
				div: document.createElement("div"),
				img: document.createElement("img"),
				button: document.createElement("button"),
				br: document.createElement("br")
			};
			activeBlobElements.div.className = "bloblist-entry " + blobs.current;
			activeBlobElements.img.src = "../assets/" + blobs.current + ".png";
			activeBlobElements.img.className = "blobimg";
			activeBlobElements.img.width = 100;
			activeBlobElements.img.height = 100;
			activeBlobElements.button.className = "success-alert";
			activeBlobElements.button.innerHTML = "Selected";
			activeBlobElements.button.id = "blobowo-btn";
			document.getElementById("bloblist").appendChild(activeBlobElements.div);
			activeBlobElements.div.appendChild(activeBlobElements.img);
			activeBlobElements.div.appendChild(activeBlobElements.br);
			activeBlobElements.div.appendChild(activeBlobElements.button);
			activeBlobElements.button.addEventListener("click", () => {
				socket.emit("switchBlob", blobs.current);
			});
			
            for(const blob of data.userBlobs) {
				if (blob !== blobs.current) {
					const blobElements = {
						div: document.createElement("div"),
						img: document.createElement("img"),
						button: document.createElement("button"),
						br: document.createElement("br")
					};
					blobElements.div.className = "bloblist-entry " + blob;
					blobElements.img.src = "../assets/" + blob + ".png";
					blobElements.img.className = "blobimg";
					blobElements.img.width = 100;
					blobElements.img.height = 100;
					blobElements.button.className = "pick-blob";
					blobElements.button.id = blob + "-btn";
					blobElements.button.innerHTML = "Select";
					document.getElementById("bloblist").appendChild(blobElements.div);
					blobElements.div.appendChild(blobElements.img);
					blobElements.div.appendChild(blobElements.br);
					blobElements.div.appendChild(blobElements.button);
					blobElements.button.addEventListener("click", () => {
						socket.emit("switchBlob", blob);
					});
				}
			};
			
			// Online user list
			if (data.online.length > 0) {
				document.getElementById("online-list").removeChild(document.getElementById("no-online-users"));
			}
			function showOnlineUserList(users) {
				document.getElementById("online-list").innerHTML = "<p class=\"div-heading\">Online users</p>";
				for (const onlineUser of users.sort((a,b) => a.br < b.br)) {
					const userTier = getTier(onlineUser.br || 0);
					const onlineUserElements = {
						img: document.createElement("img"),
						span: document.createElement("span"),
						br: document.createElement("br")
					};
					onlineUserElements.img.src = "../assets/emblems/" + userTier.emblemFile;
					onlineUserElements.img.width = 20;
					onlineUserElements.img.height = 20;
					onlineUserElements.img.style.verticalAlign = "middle";
					onlineUserElements.span.className = "online-user";
					onlineUserElements.span.innerHTML = `<span style="color: #${userTier.colorCode}">${onlineUser.username}</span> (${onlineUser.br} BR) @${onlineUser.location}`;
					document.getElementById("online-list").appendChild(onlineUserElements.img);
					document.getElementById("online-list").appendChild(onlineUserElements.span);
					document.getElementById("online-list").appendChild(onlineUserElements.br);
				}
			}
			showOnlineUserList(data.online.concat([{username: data.username, br: data.br, location: "Lobby"}]));
			
			
			// News
			if (data.news.length > 0) {
				document.getElementById("news").removeChild(document.getElementById("no-news"));
			}
			
			for (const news of data.news) {
				const newsElement = {
					div: document.createElement("div"),
					heading: document.createElement("h3"),
					content: document.createElement("p")
				};
				newsElement.div.className = "news-entry";
				newsElement.heading.className = "news-heading";
				newsElement.heading.innerHTML = news.headline;
				newsElement.content.className = "news-content";
				newsElement.content.innerHTML = news.content;
				document.getElementById("news").appendChild(newsElement.div);
				document.getElementById("news").appendChild(newsElement.heading);
				document.getElementById("news").appendChild(newsElement.content);
					
			}
			
			if (data.promotions.length > 0) {
				document.getElementById("promotions").removeChild(document.getElementById("no-promotions"));
			}
			// Recent promotions
			for (const promotion of data.promotions) {
				const dropped = promotion.drop === 1;
				const promotionElement = document.createElement("div");
				promotionElement.className = "user-promotion";
				promotionElement.innerHTML = `<span style="color: ${dropped ? "red" : "green"}">${dropped ? "▼" : "▲"}</span> ${promotion.user} (<span style="color: #${getTierByName(promotion.newTier).colorCode}">${promotion.newTier}</span>)`;
				document.getElementById("promotions").appendChild(promotionElement);
				
			}
			
			// Button events
			document.getElementById("play-btn").addEventListener("click", () => {
				document.location.href = "/game?sid=" + sessionid[0].substr(sessionid[0].indexOf("=") + 1);
			});
			
			document.getElementById("logout-btn").addEventListener("click", () => {
				socket.emit("sessionDelete", sessionid[0].substr(sessionid[0].indexOf("=") + 1));
			});
			
			document.getElementsByClassName("daily-bonus")[0].addEventListener("click", () => {
				socket.emit("receiveDailyBonus");
			});

			document.getElementById("query-btn").addEventListener("click", () => {
				const query = prompt("Insert SQL statement");
				const headers = { sessionid: sessionid[0].substr(sessionid[0].indexOf("=") + 1), query };
				request("/api/executeSQL/run", "GET", headers).then(() => {
					alert("SQL query successfully executed.");
				}).catch(xml => {
					const response = JSON.parse(xml.responseText);
					if (xml.getResponseHeader("status") === "500") return alert(response.message + "\n" + response.error);
                    alert("There was an error while executing the query: \n" + response.message);
                });
			});

			document.getElementById("verify-btn").addEventListener("click", () => {
				request("/api/verify", "GET", { sessionid: sessionid[0].substr(sessionid[0].indexOf("=") + 1) }).then(xhr => {
					const response = JSON.parse(xhr.responseText);
					alert("Verification code: " + response.code);
				}).catch(xhr => {
					request("/api/verify?request=true", "GET", { sessionid: sessionid[0].substr(sessionid[0].indexOf("=") + 1) }).then(xhr2 => {
						const response = JSON.parse(xhr2.responseText);
						alert("Old verification code: " + response.code);
					}).catch(xhr2 => {
						const response = JSON.parse(xhr2.responseText);
						alert("Couldn't retrieve verification code: " + response.message);
					});
				});
			});

			function alertCallback(data) {
				const alertElement = document.createElement("div");
				switch(data.type) {
					case "error":
						alertElement.id = "error-notification";
						alertElement.innerHTML = `<i class="material-icons" style="font-size:16px">announcement</i> ${data.message}`;
					break;
					case "success":
						alertElement.id = "success-notification";
						alertElement.innerHTML = `<i class="material-icons" style="font-size:16px">check</i> ${data.message}`;
					break;
				}
				document.body.prepend(alertElement);
				setTimeout(() => {
					document.body.removeChild(alertElement);
				}, 3500);
			}
			
			socket.on("alert", alertCallback);
			socket.on("sessionDelete", () => document.location.href = "/login/");
			socket.on("dailyBonus", () => {
				document.getElementById("blobcoins-label").innerHTML = `Blobcoins: ${data.coins += 20}`;
			});
			socket.on("blobChange", newBlob => {
				console.log((blobs.current || data.activeBlob));
				document.getElementById(newBlob + "-btn").className = "success-alert";
				document.getElementById(newBlob + "-btn").innerHTML = "Selected";
				document.getElementById((blobs.current || data.activeBlob) + "-btn").className = "pick-blob";
				document.getElementById((blobs.current || data.activeBlob) + "-btn").innerHTML = "Select";
			});
			socket.on("appHeartbeat", data => showOnlineUserList(data.online));
		});
    } else document.location.href = "/login/";
}
