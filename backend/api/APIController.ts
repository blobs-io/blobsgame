import Base from "../structures/Base";
import * as express from "express";
import Socket from "../structures/Socket";
import { appendFileSync } from "fs";
import Room from "../structures/Room";
import * as SessionIDManager from "../structures/SessionIDManager";
import Jimp = require("jimp");
import Captcha, {CAPTCHA_LIMIT} from "../structures/Captcha";
import * as DateFormatter from "../utils/DateFormatter";

export default class APIController {
    public base: Base;
    public app: express.Application;

    constructor(app: express.Application, base: Base) {
        this.app = app;
        this.base = base;
    }

    listen(): void {
        this.app.get("/api/clans/:name", (req: express.Request, res: express.Response) => {
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
        this.app.get("/api/executeSQL/:method", async (req: express.Request, res: express.Response) => {
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
            if (requester.role !== 1) {
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
                    message: "An error occured on the server. Perhaps there's a syntax error in your query?",
                    error: e.toString()
                });
                return;
            }
            appendFileSync("logs.txt", `[${new Date().toLocaleString()}] ${requester.username} executed: ${req.headers.query}\n`);
            res.status(200);
            res.json({
                result
            });
        });
        this.app.get("/api/ffa/players", (req: express.Request, res: express.Response) => {
            const room: Room | undefined = this.base.rooms.find((v: Room) => v.id === "ffa");
            if (!room) {
                res.status(500);
                res.json({
                    message: "Room not found"
                });
                return;
            }
            res.json(room.players);
        });
        this.app.get("/api/ping", (req: express.Request, res: express.Response) => {
            const arrived: number = Date.now();
            res.json({
                arrived
            })
        });
        this.app.get("/api/player/:username", async (req: express.Request, res: express.Response) => {
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
        this.app.get("/api/players", (req: express.Request, res: express.Response) => {
            this.base.db.all("SELECT username, br, createdAt, role, wins, losses FROM accounts ORDER BY br DESC LIMIT 25")
                .then((result: any) => {
                    res.json(result);
                });
        });
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
        this.app.get("/api/captcha/~/:id", (req: express.Request, res: express.Response) => {
            new Jimp(160, 32, 0x000000, (err: any, image: any) => {
                if (err) return res.status(500).json({
                    message: "An error occurred while creating the image: " + err
                });
                const requested: Captcha | undefined = this.base.captchas.find((v: Captcha) => v.id === req.params.id);
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