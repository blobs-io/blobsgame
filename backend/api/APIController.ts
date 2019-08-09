import Base from "../structures/Base";
import express from "express";
import Socket from "../structures/Socket";
import { appendFileSync } from "fs";
import Room from "../structures/Room";

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
    }
}