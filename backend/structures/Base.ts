// Import packages
import * as express from "express";
import * as ws from "ws";
import * as socket from "socket.io";
import * as http from "http";
import bodyParser = require("body-parser");

// Import structures
import * as SessionIDManager from "./SessionIDManager";
import WS from "../WSEvents";
import Room from "./Room";
import Maps from "./Maps";
import * as Socket from "./Socket";
import APIController from "../api/APIController";
import ClanController from "../clans/ClanController";
import RouteController from "../routes/RouteController";
import Captcha from "./Captcha";
import Player from "./Player";
import * as WSEvents from "../WSEvents";

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
    public sockets: Socket.default[];
    public APIController: APIController;
    public ClanController: ClanController;
    public captchas: Captcha[];
    public RouteController: RouteController;
    public wsSockets: Socket.wsSocket[];

    constructor(options: BaseOptions) {
        this.server = options.server;
        this._server = this.server.app.listen(options.server.port, options.server.readyCallback);
        this.wsServer = options.wsServer;
        this.wsSockets = [];
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

        this.wsServer.on("connection", (conn: ws) => {
            let socketID: string = SessionIDManager.generateSessionID(16);
            while(this.wsSockets.some((v: any) => v.id === socketID))
                socketID = SessionIDManager.generateSessionID(16);

            this.wsSockets.push({
                conn, id: socketID
            });
            conn.on("message", (data: any) => this.WSHandler.exec(conn, socketID, data));
        });

        setInterval(() => {
            const room: Room | undefined = this.rooms.find((v: Room) => v.id === "ffa");
            if (!room) return;
            for (let i: number = 0; i < room.players.length; ++i) {
                const player: Player = room.players[i];
                const socket: Socket.wsSocket | undefined = this.wsSockets.find((s: Socket.wsSocket) => s.id === player.id);
                if (!socket) return;
                if (Date.now() - player.lastHeartbeat > WSEvents.default.intervalLimit) {
                    socket.conn.send(JSON.stringify({
                        op: WSEvents.OPCODE.CLOSE,
                        d: {
                            message: "Missing heartbeats"
                        }
                    }));
                    WSEvents.default.disconnectSocket(socket, room);
                    continue;
                }
                player.regenerate(true);
                socket.conn.send(JSON.stringify({
                    op: WSEvents.OPCODE.EVENT,
                    t: WSEvents.EventTypes.COORDINATECHANGE,
                    d: {
                        players: room.players
                    }
                }));
            }
        }, 20);
    }
}