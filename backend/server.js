const express = require("express");
const app = express();
const socket = require("socket.io");
const server = app.listen(process.env.PORT, () => {
    console.log("App started");
});
const bcrypt = require("bcrypt");
const sqlite = require("sqlite");
const {
    existsSync,
    writeFileSync
} = require("fs");
app.use(express.static("public"));
if (!existsSync("./db.sqlite")) writeFileSync("./db.sqlite", "");
const io = socket(server);
sqlite.open("db.sqlite");
const sessions = require("./SessionIDManager");
let captchas = new Array();

/**
 * Displays an error by emitting to websocket on clientside
 * 
 * @param {string} msg The error message
 * @param {Object} data The data object (socket)
 * @param {string} event The event that should get emitted
 * @param {number} status HTTP status code (200 OK, 4xx Client, 5xx Server)
 * @return {undefined}
 */
function displayError(msg, data, event, status) {
    io.to(data.id).emit(event, {
        status: status,
        message: msg
    });
}

setInterval(() => {
    captchas = captchas.filter(val => (val.createdAt + 18e4) > Date.now());
}, 1000);

io.on("connection", data => {
    // Event listeners
    data.on("appCreate", _ => require("./events/appCreate").run(_, displayError, sessions, io, data, sqlite));
    data.on("getCaptcha", () => require("./events/getCaptcha").run(sessions, io, data, captchas));
    data.on("login", res => require("./events/login").run(res, io, data, sqlite, bcrypt, sessions, displayError));
    data.on("register", res => require("./events/register").run(res, io, data, displayError, captchas, bcrypt, sqlite));
});
