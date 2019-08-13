const server = document.location.href.match(/https?:\/\/[^\/]+/)[0];
let socket;
if (typeof io !== "undefined")
    socket = io(server);
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