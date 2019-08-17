const server = document.location.href.match(/https?:\/\/[^\/]+/)[0];
let socket;
if (typeof io !== "undefined")
    socket = io(server);