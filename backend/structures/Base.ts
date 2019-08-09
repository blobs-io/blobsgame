// Import packages
import * as express from "express";
import * as ws from "ws";
import * as socket from "socket.io";
import * as http from "http";
import bodyParser = require("body-parser");
import { readFileSync } from "fs";

// Import structures
import * as SessionIDManager from "./SessionIDManager";
import WS from "../WSEvents";
import Room from "./Room";
import Maps from "./Maps";

// Import Routes
import rootRoute from "../routes/root";
import getDatabaseRoute from "../routes/getDatabase";
import testRoute from "../routes/testRoute";
import loginRoute from "../routes/login";
import appRoute from "../routes/app";
import APIController from "../api/APIController";

interface Server {
    app: express.Application;
    _server?: any;
    port: number;
    readyCallback?: () => any;
}

interface BaseOptions {
    server: Server;
    wsServer: ws.Server;
    database?: any;
}

interface Maintenance {
    enabled: boolean;
    reason?: string;
}

export default class Base {
    static algorithm: string = process.platform === "linux" ? "./b {ownbr} {opponentbr} --br" : "b {ownbr} {opponentbr} --br";
    public server: Server;
    public wsServer: ws.Server;
    public db: any;
    public dbToken: string;
    public dbPath: string | undefined;
    public maintenance: Maintenance = {
        enabled: false
    };
    public socket: any;
    public io: socket.Server;
    public _server: http.Server;
    public WSHandler: WS;
    public rooms: Room[];
    public maps: Maps;
    public sockets: any[];
    public APIController: APIController;

    constructor(options: BaseOptions) {
        this.server = options.server;
        this._server = this.server.app.listen(options.server.port, options.server.readyCallback);
        this.wsServer = options.wsServer;
        this.db = options.database;
        this.socket = socket;
        this.sockets = [];
        this.WSHandler = new WS(this);
        this.maps = new Maps();
        this.APIController = new APIController(this.server.app, this);

        const ffaRoom: Room = new Room(this.maps.mapStore.find((v: any) => v.map.name === "default"), "ffa");
        this.rooms = [ ffaRoom ];

        this.io = this.socket(this._server);
        this.dbToken = SessionIDManager.generateSessionID(24);
    }

    /**
     * Initializes database
     *
     * @param {string} path
     * @returns {Promise<void>}
     */
    async initializeDatabase(path: string): Promise<void> {
        const { db } = this;
        this.dbPath = path;
        await db.open(path);
        await db.run("CREATE TABLE IF NOT EXISTS logs (`name` TEXT, `amount` INTEGER)");
        await db.run("CREATE TABLE IF NOT EXISTS clans (`name` TEXT, `leader` TEXT, `cr` INTEGER DEFAULT 0, `members` TEXT, `description` TEXT)");
        await db.run("CREATE TABLE IF NOT EXISTS verifications (`user` TEXT, `code` TEXT, `requestedAt` TEXT)");
        await db.run("CREATE TABLE IF NOT EXISTS recentPromotions (`user` TEXT, `newTier` TEXT, `drop` INTEGER, `promotedAt` TEXT)");
        await db.run("CREATE TABLE IF NOT EXISTS news (`headline` TEXT, `content` TEXT, `createdAt` TEXT)");
        await db.run("CREATE TABLE IF NOT EXISTS accounts (`username` TEXT, `password` TEXT, `br` INTEGER, `createdAt` TEXT, `role` INTEGER, `blobcoins` INTEGER, `lastDailyUsage` TEXT, `distance` INTEGER, blobs `TEXT`, `activeBlob` TEXT, `clan` TEXT, `wins` INTEGER, `losses` INTEGER)");
        await db.run("CREATE TABLE IF NOT EXISTS sessionids (`username` TEXT, `sessionid` TEXT, `expires` TEXT)");
        await db.run("CREATE TABLE IF NOT EXISTS bans (`username` TEXT, `reason` TEXT, `bannedAt` TEXT, `expires` TEXT, `moderator` TEXT)");
        await db.get("SELECT count(*) FROM accounts").then(console.log.bind(null, "Accounts: "));
    }

    /**
     * Initializes routes
     *
     * @returns {Promise<void>}
     */
    async initializeRoutes(): Promise<void> {
        const { app } = this.server;

        app.use(bodyParser.urlencoded({ extended: true }));

        app.get(rootRoute.route.path,          (req, res) => rootRoute.run(req, res, this));
        app.get(getDatabaseRoute.route.path,   (req, res) => getDatabaseRoute.run(req, res, this));
        app.get(testRoute.route.path,          (req, res) => testRoute.run(req, res, this));
        app.get(loginRoute.route.path,         (req, res) => loginRoute.run(req, res, this));
        app.get(appRoute.route.path,           (req, res) => appRoute.run(req, res, this));
        app.post(loginRoute.route.path,         (req, res) => loginRoute.run(req, res, this, "post"));
        app.get("/game", (req, res) => res.send(readFileSync("./public/game/index.html", "utf8")));

        // Assets / JS / CSS
        app.use("/assets", express.static("./public/assets"));
        app.use("/js", express.static("./public/js"));
        app.use("/css", express.static("./public/css"));
    }

    async initializeEvents(): Promise<void> {
        if (this.maintenance.enabled) throw new Error(this.maintenance.reason || "Maintenance");
        const { io } = this;

        io.on("connection", (data: any) => {
            data.on("disconnect", (...data: any[]) => this.WSHandler.executeEvent("disconnect", data, ...data));
            data.on("ffaPlayerCreate", (...data: any[]) => this.WSHandler.executeEvent("ffaPlayerCreate", data, ...data));
            data.on("coordinateChange", (...data: any[]) => this.WSHandler.executeEvent("coordinateChange", data, ...data));
            data.on("ffaDirectionChange", (...data: any[]) => this.WSHandler.executeEvent("ffaDirectionChange", data, ...data));
            data.on("ffaNomKey", (...data: any[]) => this.WSHandler.executeEvent("ffaNomKey", data, ...data));
            data.on("ffaKickPlayer", (...data: any[]) => this.WSHandler.executeEvent("ffaKickPlayer", data, ...data));
            data.on("sessionDelete", (...data: any[]) => this.WSHandler.executeEvent("sessionDelete", data, ...data));
        });
        setInterval(() => {
            console.log("players", this.rooms[0].players.map(v => v.owner));
        }, 3000);
    }
}