import * as express from "express";
import * as ws from "ws";
import * as socket from "socket.io";
import * as http from "http";

// Import Routes
import rootRoute from "../routes/root";
import getDatabaseRoute from "../routes/getDatabase";
import testRoute from "../routes/testRoute";

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

    constructor(options: BaseOptions) {
        this.server = options.server;
        this._server = this.server.app.listen(options.server.port, options.server.readyCallback);
        this.wsServer = options.wsServer;
        this.db = options.database;
        this.socket = socket;


        this.io = this.socket(this._server);
        this.dbToken = Math.random().toString(36).substr(2); // TODO: use crypto instead of pseudo-random
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
    }

    /**
     * Initializes routes
     *
     * @returns {Promise<void>}
     */
    async initializeRoutes(): Promise<void> {
        const { app } = this.server;

        app.get(rootRoute.route.path,          (req, res) => rootRoute.run(req, res, this));
        app.get(getDatabaseRoute.route.path,   (req, res) => getDatabaseRoute.run(req, res, this));
        app.get(testRoute.route.path,          (req, res) => testRoute.run(req, res, this))
    }
}