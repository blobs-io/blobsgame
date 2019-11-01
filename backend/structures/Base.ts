// Import packages
import * as express from "express";
import * as ws from "ws";
import * as http from "http";
import {existsSync} from "fs";
import bodyParser = require("body-parser");
import {exec} from "child_process";
// Import structures
import * as SessionIDManager from "./SessionIDManager";
import WS, * as WSEvents from "../WSEvents";
import {EventTypes, OPCODE} from "../WSEvents";
import * as Room from "./Room";
import Maps from "./Maps";
import * as Socket from "./Socket";
import {wsSocket} from "./Socket";
import APIController from "../api/APIController";
import ClanController from "../clans/ClanController";
import RouteController from "../routes/RouteController";
import Captcha from "./Captcha";
import Player from "./Player";
import EliminationRoom, {State} from "./EliminationRoom";

// Represents an http server that is used
interface Server {
    // The express router
    app: express.Application;
    // Actual HTTP server (may be undefined)
    _server?: any;
    // Port that the webserver is listening to
    port: number;
    // A callback function that is being called when the server is ready to accept requests
    readyCallback?: () => any;
}

// Represents options that may be used when instantiating Base
interface BaseOptions {
    // The server
    server: Server;
    // The database driver (sqlite)
    database?: any;
}

// Represents a Maintenance
interface Maintenance {
    // Whether this maintenance is enabled or not
    enabled: boolean;
    // The reason for this maintenance
    reason?: string;
}

// Used for sharing required data across all modules
export default class Base {
    // A command that is executed when a BR calculation is performed
    // WARNING: Watch out for this path; make sure it points to a rating-system executable!
    static algorithm: string = process.platform === "linux" ? "./b {ownbr} {opponentbr} --br" : "b {ownbr} {opponentbr} --br";
    // The server
    public server: Server;
    // The WebSocket server
    public wsServer: ws.Server;
    // The database driver
    public db: any;
    // A 45-characters long token that is used to access the database
    // WARNING: Do not give this to anyone
    // It will be logged to the console when the database is ready to execute queries
    public dbToken: string;
    // A path to the database
    public dbPath: string | undefined;
    // A maintenance
    public maintenance: Maintenance = {
        enabled: false
    };
    // The HTTP Server for the express router
    public _server: http.Server;
    // The WebSocket handler (for handling websocket messages)
    public WSHandler: WS;
    // All existing rooms
    public rooms: Room.default[];
    // A map-store
    public maps: Maps;
    // An array that includes all connected sockets
    public sockets: Socket.default[];
    // The API Controller (handles API requests)
    public APIController: APIController;
    // The Clan Controller (handles clan requests)
    public ClanController: ClanController;
    // All requested captchas
    public captchas: Captcha[];
    // The Route Controller (handles all incoming requests)
    public RouteController: RouteController;
    // All websocket connections
    public wsSockets: Socket.wsSocket[];

    constructor(options: BaseOptions) {
        // Check if rating-system binary exists
        {
            // Read executable name
            let executable = "";
            for (const c of Base.algorithm) {
                if (c === '.' || c === '/') continue;
                else if (c === ' ') break;
                executable += c;
            }
            // Platform-dependent execution command
            const platformExec = process.platform === "linux" ? executable : executable + ".exe";
            if (!existsSync(platformExec)) {
                console.warn("[warn] rating-system executable not found");
                if (process.platform === "linux") {
                    // Execute shell script if operating system is linux
                    exec(`${platformExec} > /dev/null`, (err, res) => {
                        if (err) console.error("[err] ./scripts/get-rs.sh returned non-zero exit code. Is it executable?");
                        else {
                            console.log("compiled rating-system source code");
                        }
                    });
                } else
                    console.warn("[warn] operating system is not linux, therefore get-rs.sh script cannot be executed. Please compile rating-system source code manually.");
            }
        }

        // Assign all local variables
        this.server = options.server;
        this._server = this.server.app.listen(options.server.port, options.server.readyCallback);
        this.wsServer = new ws.Server({
            server: this._server
        });
        this.wsSockets = [];
        this.db = options.database;
        this.sockets = [];
        this.WSHandler = new WS(this);
        this.maps = new Maps();
        this.APIController = new APIController(this.server.app, this);
        this.ClanController = new ClanController(this.server.app, this.db);
        this.RouteController = new RouteController(this.server.app, this);
        this.captchas = [];
        this.rooms = [];

        // 3 rooms for each room type
        for (let i: number = 0; i < 3; ++i) {
            this.rooms.push(
                new Room.default(this, this.maps.mapStore.find((v: any) => v.map.name === "default"), "ffa" + (i + 1))
            );
            this.rooms.push(
                new EliminationRoom(this, this.maps.mapStore.find((v: any) => v.map.name === "default"), "elim" + (i + 1))
            );
        }

        // Generates a "session ID", which is used to access the database
        this.dbToken = SessionIDManager.generateSessionID(24);
    }

    /**
     * Initializes database
     *
     * @param {string} path
     * @returns {Promise<void>}
     */
    public async initializeDatabase(path: string): Promise<void> {
        const { db } = this;
        this.dbPath = path;
        // Open database
        await db.open(path);
        // Create all required tables if they don't exist
        await db.run("CREATE TABLE IF NOT EXISTS logs (`name` TEXT, `amount` INTEGER);");
        await db.run("CREATE TABLE IF NOT EXISTS clans (`name` TEXT, `leader` TEXT, `cr` INTEGER DEFAULT 0, `members` TEXT, `description` TEXT)");
        await db.run("CREATE TABLE IF NOT EXISTS verifications (`user` TEXT, `code` TEXT, `requestedAt` TEXT)");
        await db.run("CREATE TABLE IF NOT EXISTS recentPromotions (`user` TEXT, `newTier` TEXT, `drop` INTEGER, `promotedAt` TEXT)");
        await db.run("CREATE TABLE IF NOT EXISTS news (`headline` TEXT, `content` TEXT, `createdAt` TEXT)");
        await db.run("CREATE TABLE IF NOT EXISTS accounts (`username` TEXT, `password` TEXT, `br` INTEGER, `createdAt` TEXT, `role` INTEGER, `blobcoins` INTEGER, `lastDailyUsage` TEXT, `distance` INTEGER, blobs `TEXT`, `activeBlob` TEXT, `clan` TEXT, `wins` INTEGER, `losses` INTEGER)");
        await db.run("CREATE TABLE IF NOT EXISTS sessionids (`username` TEXT, `sessionid` TEXT, `expires` TEXT)");
        await db.run("CREATE TABLE IF NOT EXISTS bans (`username` TEXT, `reason` TEXT, `bannedAt` TEXT, `expires` TEXT, `moderator` TEXT)");
        // Log number of existing accounts in database
        await db.get("SELECT count(*) FROM accounts").then(console.log.bind(null, "Accounts: "));
    }

    /**
     * Initializes routes
     *
     * @returns {Promise<void>}
     */
    public async initializeRoutes(): Promise<void> {
        const { app } = this.server;
        // For accessing POST body
        app.use(bodyParser.urlencoded({ extended: true }));

        // Assets / JS / CSS
        app.use("/assets", express.static("./public/assets"));
        app.use("/js", express.static("./public/js"));
        app.use("/css", express.static("./public/css"));
    }

    public async initializeEvents(): Promise<void> {
        // Maintenance check
        if (this.maintenance.enabled) throw new Error(this.maintenance.reason || "Maintenance");

        // Handle incoming WebSocket connections
        this.wsServer.on("connection", (conn: ws) => {
            // Generate unique ID
            let socketID: string = SessionIDManager.generateSessionID(16);
            while(this.wsSockets.some((v: any) => v.id === socketID))
                socketID = SessionIDManager.generateSessionID(16);

            // Push to wsSockets array
            this.wsSockets.push({
                conn, id: socketID
            });

            // Let WSHandler handle incoming WebSocket messages
            conn.on("message", (data: any) => this.WSHandler.exec(conn, socketID, data));
        });

        // Check for heartbeats and other timing-based actions
        setInterval(() => {
            for (let roomIndex: number = 0; roomIndex < this.rooms.length; ++roomIndex) {
                const room: Room.default | undefined = this.rooms[roomIndex];
                if (!room) return;

                room.broadcast((ws: wsSocket, player: Player) => {
                    if (Date.now() - player.lastHeartbeat > WSEvents.default.intervalLimit) {
                        // User has not sent heartbeats for a number of milliseconds (see WSEvents.default.intervalLimit)
                        ws.conn.send(JSON.stringify({
                            op: WSEvents.OPCODE.CLOSE,
                            d: {
                                message: "Missing heartbeats"
                            }
                        }));
                        WSEvents.default.disconnectSocket(ws, room);
                        if (room instanceof EliminationRoom && room.state === State.COUNTDOWN && room.players.length === EliminationRoom.minPlayersStartup - 1) {
                            room.state = State.WAITING;
                            room.countdownStarted = null;
                            room.broadcastSend(JSON.stringify({
                                op: OPCODE.EVENT,
                                t: EventTypes.STATECHANGE,
                                d: {
                                    state: room.state,
                                    countdownStarted: null
                                }
                            }));
                        }
                    }

                    // Generates everyones health points every Y milliseconds
                    player.regenerate(true);

                    // Transmit coordinates to all connected WebSockets if there are at least 2 players in this room
                    // Sending coordinates to rooms with only one player is unnecessary because the client doesn't need its own coordinates
                    if (room.players.length >= 2) {
                        ws.conn.send(JSON.stringify({
                            op: WSEvents.OPCODE.EVENT,
                            t: WSEvents.EventTypes.COORDINATECHANGE,
                            d: {
                                players: room.players
                            }
                        }));
                    }
                });
            }
        }, 20);
    }
}