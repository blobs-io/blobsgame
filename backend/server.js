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
let sockets = Base.sockets;
let captchas = Base.captchas;
const express = Base.express.express;
const app = Base.express.app;
const {
    existsSync,
    writeFileSync
} = require("fs");

// API
const APIController = require("./api/Controller");
const api = new APIController(Base.express.app);
api.init("get");

// Logger
const Logger = require("./Logger");
const logger = new Logger();
Base.express.app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/game/")) logger.requests.ffa++;
    logger.requests.total++;
    return next();
});

// SQLite initalization
if (!existsSync("./db.sqlite")) writeFileSync("./db.sqlite", "");
sqlite.open("db.sqlite").then(async() => {
    // Create tables if they don't already exist
    await sqlite.run("CREATE TABLE IF NOT EXISTS logs (`name` TEXT, `amount` INTEGER)");
    await sqlite.run("CREATE TABLE IF NOT EXISTS verifications (`user` TEXT, `code` TEXT, `requestedAt` TEXT)");
    await sqlite.run("CREATE TABLE IF NOT EXISTS recentPromotions (`user` TEXT, `newTier` TEXT, `drop` INTEGER, `promotedAt` TEXT)");
    await sqlite.run("CREATE TABLE IF NOT EXISTS news (`headline` TEXT, `content` TEXT, `createdAt` TEXT)");
    await sqlite.run("CREATE TABLE IF NOT EXISTS accounts (`username` TEXT, `password` TEXT, `br` INTEGER, `createdAt` TEXT, `role` INTEGER, `blobcoins` INTEGER, `lastDailyUsage` TEXT, `distance` INTEGER, blobs `TEXT`, `activeBlob` TEXT)");
    await sqlite.run("CREATE TABLE IF NOT EXISTS sessionids (`username` TEXT, `sessionid` TEXT, `expires` TEXT)");
    await sqlite.run("CREATE TABLE IF NOT EXISTS bans (`username` TEXT, `reason` TEXT, `bannedAt` TEXT, `expires` TEXT, `moderator` TEXT)");
}).catch(console.log);

setInterval(async () => {
    captchas = captchas.filter(val => (val.createdAt + 18e4) > Date.now());
    Base.sockets = Base.sockets.filter(val => val.inactiveSince === null || Date.now() < (val.inactiveSince + 30000));
    io.sockets.emit("appHeartbeat", {
		online: Base.sockets.map(v => { return {
			location: "Lobby",
			br: v.br,
			username: v.username,
			lastDaily: v.lastDaily,
			role: v.role
		}}).concat(Base.gamemodes.ffa.players.map(v => { return {
			location: "FFA",
			username: v.owner,
			br: v.br,
			role: 0
		}})),
		promotions: await sqlite.all("SELECT * FROM recentPromotions ORDER BY promotedAt DESC LIMIT 10")
    });
}, 1000);

// Emit blob objects to all FFA players
setInterval(() => {
	if (Base.gamemodes.ffa.players.length === 0) return;
    io.sockets.emit("ffaPlayerUpdate", Base.gamemodes.ffa.players);
}, 10);

io.on("connection", data => {
    try {
        data.on("disconnect", () => {
            const r = require("./events/disconnect").run(data, Base, io);
            Base.sockets = r.sockets;
            Base.gamemodes.ffa.players = r.players;
        });
        data.on("appCreate", async _ => {
            try {
                await require("./events/appCreate").run(_, utils.displayError, sessions, io, data, sqlite, sockets);
                const session = await sessions.getSession(sqlite, {
					type: "session",
					value: _
				});
				if (!session) return;
				const dbData = await require("./utils/getDataFromPlayer")(session.username, sqlite);
                Base.sockets.push({
                    sessionid: _,
                    socketid: data.id,
                    username: session.username || "?",
                    br: await require("./utils/getBRFromPlayer")(session.username, sqlite),
                    role: dbData.role,
                    lastDaily: dbData.lastDailyUsage,
                    inactiveSince: null
                });
                sessions.deleteSession(sqlite, {
                    type: "session",
                    value: _
                }).catch(()=>{});
            } catch (e) {
                console.log(e);
            }
        });

        // FFA Events
        data.on("ffaPlayerCreate", blob => {
            require("./events/ffaPlayerCreate").run(blob, io, Base, data, Base.sockets);
        });
        data.on("ffaCoordinateChange", eventd => {
            require("./events/ffaCoordinateChange").run(eventd, data, io, Base, sqlite);
        });
        data.on("ffaDirectionChange", eventd => {
            require("./events/ffaDirectionChange").run(eventd, data, io, Base);
        });
        data.on("ffaNomKey", () => require("./events/ffaNomKey").run(data, io, Base, sqlite));

        // Other events
	data.on("requestOnlineCount", () => io.to(data.id).emit("onlineCount", Base.sockets.filter(v => v.inactiveSince === null).concat(Base.gamemodes.ffa.players).length));
        data.on("getCaptcha", () => require("./events/getCaptcha").run(sessions, io, data, captchas).then(res => captchas = res));
        data.on("login", res => require("./events/login").run(res, io, data, sqlite, bcrypt, sessions, utils.displayError));
        data.on("register", res => require("./events/register").run(res, io, data, utils.displayError, captchas, bcrypt, sqlite));
        data.on("sessionDelete", sessionid => require("./events/sessionDelete").run(sessionid, sessions, sqlite, io, data));
        data.on("receiveDailyBonus", () => require("./events/receiveDailyBonus").run(data, io, Base.sockets, sqlite));
        data.on("switchBlob", blob => require("./events/switchBlob").run(data, io, Base.sockets, sqlite, blob));
    } catch (e) {}
});
