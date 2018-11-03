const Base = require("./Base");
const {
    socket,
    server,
    bcrypt,
    sqlite,
    io,
    sessions,
    utils
} = Base;
let {
    captchas,
    sockets
} = Base;
const express = Base.express.express;
const app = Base.express.app;
const {
    existsSync,
    writeFileSync
} = require("fs");
// SQLite initalization                                                                      

if (!existsSync("./db.sqlite")) writeFileSync("./db.sqlite", "");
sqlite.open("db.sqlite").then(async() => {
    // Create tables if they don't already exist                                                                                 
    await sqlite.run("CREATE TABLE IF NOT EXISTS accounts (`username` TEXT, `password` TEXT, `br` INTEGER, `createdAt` TEXT)");
    await sqlite.run("CREATE TABLE IF NOT EXISTS sessionids (`username` TEXT, `sessionid` TEXT, `expires` TEXT)");
}).catch(console.log);

setInterval(() => {
    captchas = captchas.filter(val => (val.createdAt + 18e4) > Date.now());
}, 1000);

// FFA Game API
app.get("/ffap", (req, res) => {
    res.send(Base.gamemodes.ffa.players);
});

// Emit blob objects to all FFA players
setInterval(() => {
    io.sockets.emit("ffaPlayerUpdate", Base.gamemodes.ffa.players);
}, 10);

// Assign Walls to FFA Map
for (let i = 0; i < 500; ++i) {
    Base.gamemodes.ffa.objects.walls.push({
        x: Math.floor(Math.random() * 1600) + 20,
        y: Math.floor(Math.random() * 1600) + 20,
    });
}


io.on("connection", data => {
    try {
        data.on("disconnect", () => {
            const r = require("./events/disconnect").run(sockets, data, Base, io);
            sockets = r.sockets;
            Base.gamemodes.ffa.players = r.players;
        });
        data.on("appCreate", async _ => {
            try {
                require("./events/appCreate").run(_, utils.displayError, sessions, io, data, sqlite, sockets)
                sockets.push({
                    sessionid: _,
                    socketid: data.id
                });
            } catch (e) {
                console.log(e);
            }
        });

        // FFA Events
        data.on("ffaPlayerCreate", blob => {
            require("./events/ffaPlayerCreate").run(blob, io, Base, data);
        });
        data.on("ffaCoordinateChange", eventd => {
            require("./events/ffaCoordinateChange").run(eventd, data, io, Base);
        });
        data.on("ffaDirectionChange", eventd => {
            require("./events/ffaDirectionChange").run(eventd, data, io, Base);
        });

        // Other events
        data.on("requestOnlineCount", () => io.to(data.id).emit("onlineCount", sockets.length));
        data.on("getCaptcha", () => require("./events/getCaptcha").run(sessions, io, data, captchas).then(res => captchas = res));
        data.on("login", res => require("./events/login").run(res, io, data, sqlite, bcrypt, sessions, utils.displayError));
        data.on("register", res => require("./events/register").run(res, io, data, utils.displayError, captchas, bcrypt, sqlite));
        data.on("sessionDelete", sessionid => require("./events/sessionDelete").run(sessionid, sessions, sqlite, io, data));
    } catch (e) {}
});
