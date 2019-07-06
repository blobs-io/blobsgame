import * as express from "express";
import * as ws from "ws";

// Import Routes
import rootRoute from "../routes/root";
import getDatabaseRoute from "../routes/getDatabase";

interface Server {
    app: express.Application;
    port: number;
    readyCallback?: () => any;
}

interface BaseOptions {
    server: Server;
    wsServer: ws.Server;
    database?: any;
}


export default class Base {
    public server: Server;
    public wsServer: ws.Server;
    public db: any;
    public dbToken: string;
    public dbPath: string | undefined;

    constructor(options: BaseOptions) {
        this.server = options.server;
        this.server.app.listen(options.server.port, options.server.readyCallback);
        this.wsServer = options.wsServer;
        this.db = options.database;

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

        app.get("/",          (req, res) => rootRoute.run(req, res, this));
        app.get("/db.sqlite", (req, res) => getDatabaseRoute.run(req, res, this));
    }
}