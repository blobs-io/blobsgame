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
        if ([400, 500].indexOf(data.status) > -1) {
            document.getElementById("auth").innerHTML = message.replace("<type>", "failure").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
        } else {
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
            if (data.status >= 400 && data.status < 500) document.location.href = server + "/login/";
        });
    } else {
        document.location.href = server + "/login/";
    }
}
