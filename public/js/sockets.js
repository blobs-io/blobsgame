const server = "http://localhost:3000";
const socket = io.connect(server);
const message = "<div id=\"<type>-notif\"><message></div>";

if (/register(\/.*)?$/.test(window.location.href)) {
    socket.emit("getCaptcha");
    socket.on("captcha", function (data) {
        const ctx = document.getElementsByTagName("canvas")[0].getContext("2d");
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(data.captcha, data.position.x, data.position.y);
    });

    document.getElementById("register-btn").addEventListener("click", function () {
        socket.emit("register", {
            username: document.getElementById("user").value,
            password: document.getElementById("pass").value,
            captcha: document.getElementById("captcha-input").value
        });
    });

    socket.on("register", function (data) {
        const element = document.createElement("div");
        if(document.getElementById("failure-notif")) {
            document.getElementById("auth").removeChild(document.getElementById("failure-notif"));
        }
        if ([400, 500].indexOf(data.status) > -1) {
            element.id = "failure-notif";
            element.innerHTML = data.message;
            document.getElementById("auth").prepend(element);
        } else {
            if(document.getElementById("success-notif")){
                document.getElementById("auth").removeChild(document.getElementById("success-notif"));
            }
            document.getElementById("auth").innerHTML = message.replace("<type>", "success").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
        }
    });
} else if (/login(\/.*)?$/.test(window.location.href)) {
    document.getElementById("login-btn").addEventListener("click", function (data) {
        socket.emit("login", {
            username: document.getElementById("user").value,
            password: document.getElementById("pass").value
        });
        socket.on("login", function (data) {
            if ([400, 500].indexOf(data.status) > -1) {
                document.getElementById("auth").innerHTML = message.replace("<type>", "failure").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
            } else {
                document.getElementById("auth").innerHTML = message.replace("<type>", "success").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
                if (typeof data.session_id !== "undefined") document.location.href = server + "/app?sessionid=" + data.session_id;
            }
        });
    });
} else if (/app(\/.*)?/.test(window.location.href)) {
    const sessionid = (window.location.search.match(/[\?\&]sessionid=[^\&]{12,20}/) || []);
    if (sessionid.length > 0) {
        socket.emit("appCreate", sessionid[0].substr(sessionid[0].indexOf("=") + 1));
        socket.on("appCreate", function (data) {
            if (data.status != 200){
                document.location.href = server + "/login/";
            }
            const body = document.getElementsByTagName("body")[0]
            body.removeChild(document.getElementsByTagName("iframe")[0]);
            const elements = {
                authDiv: document.createElement("div"),
                brLabel: document.createElement("span"),
                logoutBtn: document.createElement("span"),
                greeting: document.createElement("h2"),
                // Singleplayer Box
                mmBoxesSP: document.createElement("div"),
                spHeading: document.createElement("h3"),
                blobKittenKnifeIMG: document.createElement("img"),
                // Multiplayer box
                mmBoxesMP: document.createElement("div"),
                mpHeading: document.createElement("h3"),
                blobEvilIMG: document.createElement("img"),
                // Blobs box
                mmBoxesBlobs: document.createElement("div"),
                blobsHeading: document.createElement("h3"),
                blobEyesIMG: document.createElement("img"),
                // Settings box
                mmBoxesSTG: document.createElement("div"),
                stgHeading: document.createElement("h3"),
                blobPeekIMG: document.createElement("img")
            };

            elements.authDiv.id = "auth";
            elements.brLabel.className = "mm-br-label";
            elements.brLabel.innerHTML = `<span id="br">${data.br}</span> BR`;
            elements.logoutBtn.className = "mm-logout-btn";
            elements.logoutBtn.innerHTML = "Log-out";
            elements.greeting.innerHTML = `Welcome back, <span id="username">${data.username}</span>.`;
            elements.mmBoxesSP.className = "mm-box mm-sp-box";
            elements.spHeading.innerHTML = "Singleplayer";
            elements.blobKittenKnifeIMG.src = "../assets/BlobKittenKnife.png";
            elements.blobKittenKnifeIMG.id = "blob";
            elements.mmBoxesMP.className = "mm-box mm-mp-box";
            elements.mpHeading.innerHTML = "Multiplayer";
            elements.blobEvilIMG.src = "../assets/blobevil.png";
            elements.blobEvilIMG.id = "blob";
            elements.mmBoxesBlobs.className = "mm-box mm-blobs-box"
            elements.blobsHeading.innerHTML = "Blobs";
            elements.blobEyesIMG.src = "../assets/blobeyes.png";
            elements.blobEyesIMG.id = "blob";
            elements.mmBoxesSTG.className = "mm-box mm-stg-box";
            elements.stgHeading.innerHTML = "Settings";
            elements.blobPeekIMG.src = "../assets/blobpeek.png";
            elements.blobPeekIMG.id = "blob";
            body.appendChild(elements.authDiv);
            elements.authDiv.appendChild(elements.brLabel);
            elements.authDiv.appendChild(elements.logoutBtn);
            elements.authDiv.appendChild(elements.greeting);
            // Appending singleplayer elements
            elements.authDiv.appendChild(elements.mmBoxesSP);
            elements.mmBoxesSP.appendChild(elements.spHeading);
            elements.mmBoxesSP.appendChild(elements.blobKittenKnifeIMG);
            // Appending multiplayer elements
            elements.authDiv.appendChild(elements.mmBoxesMP);
            elements.mmBoxesMP.appendChild(elements.mpHeading);
            elements.mmBoxesMP.appendChild(elements.blobEvilIMG);
            // Appending "blobs" elements
            elements.authDiv.appendChild(elements.mmBoxesBlobs);
            elements.mmBoxesBlobs.appendChild(elements.blobsHeading);
            elements.mmBoxesBlobs.appendChild(elements.blobEyesIMG);
            // Appending "settings" elements
            elements.authDiv.appendChild(elements.mmBoxesSTG);
            elements.mmBoxesSTG.appendChild(elements.stgHeading);
            elements.mmBoxesSTG.appendChild(elements.blobPeekIMG);
            
            elements.logoutBtn.addEventListener("click", () => {
                socket.emit("sessionDelete", sessionid[0].substr(sessionid[0].indexOf("=") + 1));
            });
            socket.on("sessionDelete", () => document.location.href = "/login/");
        });
    } else {
        document.location.href = server + "/login/";
    }
}
