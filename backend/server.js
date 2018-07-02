const Base = require("./Base");
const { socket, server, bcrypt, sqlite, io, sessions, utils } = Base;
let { captchas, sockets } = Base;
const express = Base.express.express;
const app = Base.express.app;




const {
    existsSync,
    writeFileSync
} = require("fs");
if (!existsSync("./db.sqlite")) writeFileSync("./db.sqlite", "");
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



setInterval(() => {
    captchas = captchas.filter(val => (val.createdAt + 18e4) > Date.now());
}, 1000);

io.on("connection", data => {
    // Event listeners
    data.on("disconnect", () => {
        sockets = require("./events/disconnect").run(sockets, data);
    });
    data.on("appCreate", async _ => {
        try {
            require("./events/appCreate").run(_, utils.displayError, sessions, io, data, sqlite, sockets)
            sockets.push({
                sessionid: _, 
                socketid: data.id
            });
        }catch(e){
            console.log(e);
        }     
    });
    data.on("getCaptcha", () => require("./events/getCaptcha").run(sessions, io, data, captchas).then(res => captchas = res));
    data.on("login", res => require("./events/login").run(res, io, data, sqlite, bcrypt, sessions, utils.displayError));
    data.on("register", res => require("./events/register").run(res, io, data, utils.displayError, captchas, bcrypt, sqlite));
    data.on("sessionDelete", sessionid => require("./events/sessionDelete").run(sessionid, sessions, sqlite, io, data));
});