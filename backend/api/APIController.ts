// Imports
import Base from "../structures/Base";
import * as express from "express";
import Socket from "../structures/Socket";
import { appendFileSync } from "fs";
import Room from "../structures/Room";
import * as SessionIDManager from "../structures/SessionIDManager";
import Jimp = require("jimp");
import Captcha, {CAPTCHA_LIMIT} from "../structures/Captcha";
import * as DateFormatter from "../utils/DateFormatter";
import EliminationRoom from "../structures/EliminationRoom";
import { Role } from "../structures/Player";

// Used for listening to requests that are related to the API
export default class APIController {
    // A reference to the base object
    public base: Base;
    // A reference to the express router
    public app: express.Application;

    constructor(app: express.Application, base: Base) {
        // Assign local variables to object
        this.app = app;
        this.base = base;
    }

    // This function may only be called once
    // It creates listeners for every endpoint
    public listen(): void {
        // GET Endpoint: /api/clans/:name
        // Retrieve information about a specific clan
        this.app.get("/api/clans/:name", (req: express.Request, res: express.Response) => {
            if (Array.isArray(req.params)) return;
            if (req.params.name === "list") {
                this.base.db.all("SELECT members, cr, name FROM clans ORDER BY cr DESC LIMIT 10")
                    .then((v: any) => {
                        res.json(v);
                    })
                    .catch((err: any) => {
                        res.status(500);
                        res.json({
                            message: "An error occurred",
                            error: err.stack
                        });
                    });
            }
        });
        
        // GET Endpoint: /api/executeSQL/:method
        // Executes an SQL query and returns it as body
        // This requires you to authorize and must be called by a user that has 1 as role (administrator)
        // method param can be: 
        // run: Executes a query (inserting, updating, ...)
        // all: Executes a query and returns all occurrences
        this.app.get("/api/executeSQL/:method", async (req: express.Request, res: express.Response) => {
            if (Array.isArray(req.params)) return;
            if (typeof req.headers.sessionid !== "string" || typeof req.headers.query !== "string") {
                res.status(400);
                res.json({
                    message: "Either sessionid or query header is not a string."
                });
                return;
            }

            const requester: Socket | undefined = this.base.sockets.find((v: Socket) => v.sessionid === req.headers.sessionid);
            if (typeof requester === "undefined") {
                res.status(400);
                res.json({
                    message: "Invalid session ID was provided. Check sessionid header."
                });
                return;
            }
            if (requester.role !== Role.ADMIN) {
                res.status(403);
                res.json({
                    message: "You are not allowed to execute SQL queries."
                });
                return;
            }
            let result;
            try {
                result = await this.base.db[req.params.method](req.headers.query);
            } catch(e) {
                res.status(403);
                res.json({
                    error: e.toString(),
                    message: "An error occured on the server. Perhaps there's a syntax error in your query?"
                });
                return;
            }
            appendFileSync("logs.txt", `[${new Date().toLocaleString()}] ${requester.username} executed: ${req.headers.query}\n`);
            res.status(200);
            res.json({
                result
            });
        });

        // GET Endpoint: /api/players/:roomid
        // Returns an array of all players in a room
        this.app.get("/api/players/:roomid", (req: express.Request, res: express.Response) => {
            if (Array.isArray(req.params)) return;
            const roomID: string = req.params.roomid;
            const room: Room | undefined = this.base.rooms.find((v: Room) => v.id === roomID);
            if (!room) {
                res.status(500);
                res.json({
                    message: "Room not found"
                });
                return;
            }
            res.json(room.players);
        });

        // GET Endpoint: /api/rooms
        // Returns an array of all existing rooms
        // Rooms are defined in the base object
        this.app.get("/api/rooms", (req: express.Request, res: express.Response) => {
            const rooms: any[] = this.base.rooms.map((v: Room) => {
                const retVal: any = {
                id: v.id,
                players: v.players.map(p => ({
                    username: p.owner,
                    br: p.br,
                    guest: p.guest
                })),
                createdAt: v.createdAt
                };
                if (v instanceof EliminationRoom) {
                    Object.defineProperties(retVal, {
                        waitingTime: {
                            value: EliminationRoom.waitingTime,
                            enumerable: true
                        },
                        minPlayersStartup: {
                            value: EliminationRoom.minPlayersStartup,
                            enumerable: true
                        },
                        countdownStarted: {
                            value: v.countdownStarted,
                            enumerable: true
                        },
                        state: {
                            value: v.state,
                            enumerable: true
                        }
                    });
                }
                return retVal;
            });
            res.json(rooms);
        });

        // GET Endpoint: /api/ping
        // Returns the timestamp (milliseconds since 1970-01-01) of when the request was received
        // This is used to calculate the ping (time it takes for a request to send)
        this.app.get("/api/ping", (req: express.Request, res: express.Response) => {
            const arrived: number = Date.now();
            res.json({
                arrived
            })
        });

        // GET Endpoint: /api/player/:username
        // Retrieve information about a specific user
        // Returns: username, br, createdAt, role
        this.app.get("/api/player/:username", async (req: express.Request, res: express.Response) => {
            if (Array.isArray(req.params)) return;
            if (typeof req.params.username === "undefined") {
                res.status(400);
                res.json({
                    message: "No username provided."
                });
                return;
            }

            const result = await this.base.db.get("SELECT username, br, createdAt, role FROM accounts WHERE username = ?", req.params.username);
            if (!result) {
                res.status(400);
                res.json({
                    message: "User not found"
                });
                return;
            }
            res.status(200);
            res.json({
                result
            });
        });

        // GET Endpoint: /api/players
        // Returns an array of top 25 players, sorted by BR
        this.app.get("/api/players", (req: express.Request, res: express.Response) => {
            this.base.db.all("SELECT username, br, createdAt, role, wins, losses FROM accounts ORDER BY br DESC LIMIT 25")
                .then((result: any) => {
                    res.json({ result });
                });
        });

        // GET Endpoint: /api/verify
        // This is used to link a Discord account to your blobs.live account
        this.app.get("/api/verify", async (req: express.Request, res: express.Response) => {
            if (typeof req.headers.code === "undefined") {
                if (typeof req.headers.sessionid === "undefined") {
                    res.status(400);
                    res.json({
                        message: "Session ID not set. Check sessionid header."
                    });
                    return;
                }
                const requester: Socket | undefined = this.base.sockets.find((v: Socket) => v.sessionid === req.headers.sessionid);
                if (!requester) {
                    res.status(403);
                    res.json({
                        message: "Invalid session ID was provided."
                    });
                    return;
                }

                if (req.query.request === "true") {
                    const query = await this.base.db.get("SELECT code FROM verifications WHERE user = ?", requester.username);
                    if (!query) {
                        res.status(400);
                        res.json({
                            message: "User did not request a verification code"
                        });
                        return;
                    }

                    res.json({
                        code: query.code
                    });
                    return;
                }

                const query: any = await this.base.db.get("SELECT * FROM verifications WHERE user = ?", requester.username);
                if (query) {
                    res.status(403);
                    res.json({
                        message: "User already requested a verification code"
                    });
                    return;
                }
                let verificationCode;
                while(true) {
                    verificationCode = SessionIDManager.generateSessionID(16);
                    const code = await this.base.db.get("SELECT code FROM verifications WHERE code = ?", verificationCode);
                    if (!code) break;
                }
                await this.base.db.run("INSERT INTO verifications VALUES (?, ?, ?)", requester.username, verificationCode, Date.now());
                res.json({
                    code: verificationCode
                });
            } else if (typeof req.headers.code === "string") {
                const result: {code: string, user: string} | undefined = await this.base.db.get("SELECT user FROM verifications WHERE code = ?", req.headers.code);
                if (!result) {
                    res.status(400);
                    res.json({
                        message: "Code was not found"
                    });
                    return;
                }
                await this.base.db.run("DELETE FROM verifications WHERE code = ?", req.headers.code);
                res.json({
                    user: result.user
                });
            } else {
                res.status(400);
                res.json({
                    message: "Code is not a string. Check code header."
                });
            }
        });

        // GET Endpoint: /api/captcha/~/:id
        // Returns the requested captcha (as image/jpeg)
        // To retrieve an ID, send a GET request to /api/captcha/request
        this.app.get("/api/captcha/~/:id", (req: (express.Request), res: express.Response) => {
            if (Array.isArray(req.params)) return;
            const captchaID = req.params.id;
            new Jimp(160, 32, 0x000000, (err: any, image: any) => {
                if (Array.isArray(req.params)) return;
                if (err) return res.status(500).json({
                    message: "An error occurred while creating the image: " + err
                });
                const requested: Captcha | undefined = this.base.captchas.find((v: Captcha) => v.id === captchaID);
                if (!requested) return res.status(400).json({
                    message: "Requested captcha not found"
                });
                Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then(font => {
                    image
                        .print(font, 5, 5, requested.captcha)
                        .getBufferAsync(Jimp.MIME_JPEG)
                        .then((buff: Buffer) => {
                            res.header("Content-Type", "image/jpeg");
                            res.send(buff);
                        });
                });
            });
        });

        // GET Endpoint: /api/captcha/request
        // Note: If more than 100 captchas have been requested in a short time, you will have to wait; this is to prevent abuse
        // Generates an ID that is used to verify as a human when registering
        this.app.get("/api/captcha/request", (req: express.Request, res: express.Response) => {
            if (this.base.captchas.length >= CAPTCHA_LIMIT) return res.status(400).json({
                message: "Too many captchas. Please try again later."
            });
            const id: string = SessionIDManager.generateSessionID(16);
            const captcha: string = SessionIDManager.generateSessionID(8);
            const generatedAt: number = Date.now();
            this.base.captchas.push({
                id, generatedAt, captcha
            });
            res.json({
                url: `/api/captcha/~/${id}`,
                validUntil: generatedAt + 300000
            });

            setTimeout(() => {
                this.base.captchas.splice(this.base.captchas.findIndex((v: Captcha) => v.captcha === captcha), 1);
            }, 300000);
        });

        // POST /api/daily
        // Note: This may only be requested every 24 hours
        // Every user is able to request a daily bonus by POSTing to this endpoint
        this.app.post("/api/daily", async (req: express.Request, res: express.Response) => {
            const { session } = req.headers;
            if (!session) return res.status(400).json({
                message: "No session ID provided. Check session header."
            });
            const socket: Socket | undefined = this.base.sockets.find((v: Socket) => v.sessionid === session);
            if (!socket)
                return res.status(400).json({
                    message: "Socket not found. Try logging in again and retry."
                });
            const dbUser: any = await this.base.db.get("SELECT * FROM accounts WHERE username = ?", socket.username);
            if (Date.now() - dbUser.lastDailyUsage <= 86400000)
                return res.status(400).json({
                    message: `Please wait ${DateFormatter.format(86400000 - (Date.now() - dbUser.lastDailyUsage))}`
                });
            this.base.db.run("UPDATE accounts SET lastDailyUsage = ?, blobcoins = blobcoins + 20 WHERE username = ?", Date.now(), socket.username)
                .then(() => {
                    res.json({
                        message: "Successfully received daily bonus",
                        bonus: 20
                    });
                }).catch((err: any) => {
                    res.status(500).json({
                        message: "An error occured while updating database: " + err
                    });
                });
        });

        // POST /api/switchBlob
        // Used to switch blobs
        // To find a list of blobs, search in public/assets. All static images can be used (assuming the authenticated user has it unlocked)
        this.app.post("/api/switchBlob", async (req: express.Request, res: express.Response) => {
            const { blob: newBlob } = req.query;
            const { session } = req.headers;
            if (!newBlob) return res.status(400).json({
                message: "No blob provided. Check blob query."
            });
            if (!session) return res.status(400).json({
                message: "No session ID provided. Check session header."
            });
            const socket: Socket | undefined = this.base.sockets.find((v: Socket) => v.sessionid === session);
            if (!socket)
                return res.status(400).json({
                    message: "Socket not found. Try logging in again and retry."
                });
            const dbUser: any = await this.base.db.get("SELECT blobs FROM accounts WHERE username = ?", socket.username);
            const availableBlobs: string[] = dbUser.blobs.split(",");
            if (!availableBlobs.includes(newBlob)) return res.status(400).json({
                message: "You don't own this blob."
            });
            this.base.db.run("UPDATE accounts SET activeBlob = ? WHERE username = ?", newBlob, socket.username)
                .then(() => {
                    res.json({
                        message: "Blob has been changed."
                    });
                });
        });
    }
}