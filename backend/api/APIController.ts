import Base from "../structures/Base";
import express from "express";
import Socket from "../structures/Socket";
import { appendFileSync } from "fs";
import Room from "../structures/Room";
import * as SessionIDManager from "../structures/SessionIDManager";

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
                    .then(res.json)
                    .catch((err: any) => {
                        res.status(500);
                        res.json({
                            message: "An error occured",
                            error: err
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

            const requester: Socket = this.base.sockets.find((v: Socket) => v.sessionid === req.headers.sessionid);
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
                .then(res.json);
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
                const requester: Socket = this.base.sockets.find((v: Socket) => v.sessionid === req.headers.sessionid);
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

    }
}