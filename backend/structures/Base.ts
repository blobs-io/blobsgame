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
import Socket from "./Socket";
import APIController from "../api/APIController";
import ClanController from "../clans/ClanController";
import RouteController from "../routes/RouteController";
import Captcha from "./Captcha";

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
    public sockets: Socket[];
    public APIController: APIController;
    public ClanController: ClanController;
    public captchas: Captcha[];
    public RouteController: RouteController;

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
        this.ClanController = new ClanController(this.server.app, this.db);
        this.RouteController = new RouteController(this.server.app, this);
        this.captchas = [];

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

        // Assets / JS / CSS
        app.use("/assets", express.static("./public/assets"));
        app.use("/js", express.static("./public/js"));
        app.use("/css", express.static("./public/css"));
    }

    async initializeEvents(): Promise<void> {
        if (this.maintenance.enabled) throw new Error(this.maintenance.reason || "Maintenance");
        const { io } = this;

        io.on("connection", (data: any) => {
            data.on("disconnect", (...args: any[]) => this.WSHandler.executeEvent("disconnect", data, ...args));
            data.on("ffaPlayerCreate", (...args: any[]) => this.WSHandler.executeEvent("ffaPlayerCreate", data, ...args));
            data.on("coordinateChange", (...args: any[]) => this.WSHandler.executeEvent("coordinateChange", data, ...args));
            data.on("ffaDirectionChange", (...args: any[]) => this.WSHandler.executeEvent("ffaDirectionChange", data, ...args));
            data.on("ffaNomKey", (...args: any[]) => this.WSHandler.executeEvent("ffaNomKey", data, ...args));
            data.on("ffaKickPlayer", (...args: any[]) => this.WSHandler.executeEvent("ffaKickPlayer", data, ...args));
            data.on("sessionDelete", (...args: any[]) => this.WSHandler.executeEvent("sessionDelete", data, ...args));
        });

        setInterval(() => {
            const room: Room | undefined = this.rooms.find((v: Room) => v.id === "ffa");
            if (!room) return;
            io.sockets.emit("coordinateChange", room.players);
        }, 20);
    }
}