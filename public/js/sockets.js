const socket = io.connect("localhost:3000");
const message = "<div id=\"<type>-notif\"><message></div>";

if (/register(\/.*)?$/.test(window.location.href)) {
    socket.emit("getCaptcha");
    socket.on("captcha", function(data){
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
            }
        });
    });
}
