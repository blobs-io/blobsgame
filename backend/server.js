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
sqlite.open("db.sqlite").then(() => {
    sqlite.get("SELECT * FROM accounts").catch(err => {
        if (err.toString().includes("no such table: accounts")) {
            sqlite.run("CREATE TABLE accounts (`username` TEXT, `password` TEXT, `br` INTEGER)").then(() => {
                console.log(`[${new Date().toLocaleString()}] Created table: accounts.`);
            }).catch(console.log);
        } else console.log(err);
    });
    sqlite.get("SELECT * FROM sessionids").catch(err => {
        if (err.toString().includes("no such table: sessionids")) {
            sqlite.run("CREATE TABLE sessionids (`username` TEXT, `sessionid` TEXT, `expires` TEXT)").then(() => {
                console.log(`[${new Date().toLocaleString()}] Created table: sessionids.`);
            }).catch(console.log);
        } else console.log(err);
    });
}).catch(console.log);
const sessions = require("./SessionIDManager"),
utils = { };
let captchas = new Array(),
sockets = new Map();

require("./utils/utilManager")().then(utilities => {
    for(const val of utilities){
        utils[val.name] = val.method;
    }
});


setInterval(() => {
    captchas = captchas.filter(val => (val.createdAt + 18e4) > Date.now());
}, 1000);

io.on("connection", data => {
    // Event listeners
    data.on("appCreate", _ => require("./events/appCreate").run(_, utils.displayError, sessions, io, data, sqlite));
    data.on("getCaptcha", () => require("./events/getCaptcha").run(sessions, io, data, captchas).then(res => captchas = res));
    data.on("login", res => require("./events/login").run(res, io, data, sqlite, bcrypt, sessions, utils.displayError));
    data.on("register", res => require("./events/register").run(res, io, data, utils.displayError, captchas, bcrypt, sqlite));
    data.on("sessionDelete", sessionid => require("./events/sessionDelete").run(sessionid, sessions, sqlite, io, data));
});