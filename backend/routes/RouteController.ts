import Base from "../structures/Base";
import * as express from "express";
import * as SessionIDManager from "../structures/SessionIDManager";
import {readFile} from "fs";
import * as bcrypt from "bcrypt";
import Captcha from "../structures/Captcha";

export default class RouteController {
    public base: Base;
    public app: express.Application;

    constructor(app: express.Application, base: Base) {
        this.app = app;
        this.base = base;
    }

    listen(): void {
        const { base } = this;
        this.app.get("/app", async (req: express.Request, res: express.Response) => {
            const { session } = req.cookies;
            if (!session)
                return res.send("<script>document.location.href='/login';</script>");

            const dbSession: any = await SessionIDManager.getSession(base.db, {
                type: "session",
                value: session
            });
            const user: any = await base.db.get("SELECT * FROM accounts WHERE username = ?", dbSession.username);
            const promotions: any = await base.db.all("SELECT * FROM recentPromotions ORDER BY promotedAt DESC LIMIT 10");
            base.sockets.push({
                username: dbSession.username,
                br: user.br,
                role: user.role,
                guest: false,
                sessionid: session
            });

            readFile("./public/app.html", "utf8", (error: any, data: string) => {
                res.send(
                    data
                        .replace(/\[!BLOBRATING]/g, user.br)
                        .replace(/\[!BLOBCOINS]/g, user.blobcoins)
                        .replace(/\[!DISTANCE]/g, user.distance)
                        .replace(/\[!ACTIVEBLOB]/g, user.activeBlob).replace(/\[!USERBLOBS]/g, user.blobs).replace(/\[!PROMOTIONS]/g, JSON.stringify(promotions))
                );
            });
        });
        this.app.get("/db.sqlite", (req: express.Request, res: express.Response) => {
            if (req.query.token !== base.dbToken) {
                res.status(401).json({
                    message: "Invalid token"
                });
                return;
            } else {
                readFile(base.dbPath || "./db.sqlite", (error, file) => {
                    if (error) return res.status(500).json({
                        message: "An error occured on the server"
                    });
                    else res.send(file);
                });
            }
        });
        this.app.get("/login", (req: express.Request, res: express.Response) => {
            readFile("./public/login.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });
                res.send(r);
            });
        });
        this.app.post("/login", async (req: express.Request, res: express.Response) => {
            const { username, password } = req.body;
            if (!username || !password || typeof username !== "string" || typeof password !== "string")
                return res.status(401).json({
                    message: "Please enter a valid username and password."
                });

            const banned: { is: boolean, reason?: string, expires?: number } = {
                is: false
            };
            await base.db.prepare("SELECT reason, expires FROM bans WHERE username = ?").then((prepare: { get: (query: Array<string>) => any }) => {
                prepare.get([username]).then((result: { expires: string, reason: string } | undefined) => {
                    if (typeof result === "undefined") return;
                    if (Date.now() > Number(result.expires))
                        return base.db.prepare("DELETE FROM bans WHERE username=?")
                            .then((prepared: { run: (query: Array<string>) => any }) => prepared.run([username]));
                    banned.is = true;
                    banned.reason = result.reason;
                    banned.expires = Number(result.expires);
                });
            });
            if (banned.is && banned.expires)
                return res.status(403).json({
                    message: "You have been banned.",
                    reason: banned.reason,
                    expires: new Date(banned.expires).toLocaleString()
                });

            base.db.prepare("SELECT * FROM accounts WHERE username = ?")
                .then((prepare: any) => prepare.get([ username ]))
                .then(async (result: any) => {
                    if (!result)
                        return res.status(401).json({
                            message: "Invalid username or password."
                        });
                    if (!bcrypt.compareSync(password, result.password))
                        return res.status(401).json({
                            message: "Wrong password."
                        });

                    const sessionExists: boolean = await SessionIDManager.exists(base.db, {
                        type: "username",
                        value: username
                    });

                    if (sessionExists)
                        await SessionIDManager.deleteSession(base.db, {
                            type: "username",
                            value: username
                        });

                    const sessionID: string = await SessionIDManager.registerID(base.db, username)


                    // Successfully logged in
                    res.send(`
                        <script>
                            document.cookie = "session=${sessionID};expires=${new Date(Date.now() + 9e5).toUTCString()};path=/";
                            document.location.href = "/app";
                        </script>
                    `)
                });
        });
        this.app.get("/register", (req: express.Request, res: express.Response) => {
            readFile("./public/register.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });
                res.send(r);
            });
        });
        this.app.post("/register", async (req: express.Request, res: express.Response) => {
            if (typeof req.body.username !== "string" || typeof req.body.password !== "string" || typeof req.body["captcha-input"] !== "string")
                return res.send("Username, password and captcha need to be set."); // TODO: better error
            if (req.body.username.length < 3 || req.body.username.length > 14)
                return res.send("Username needs to be between 3 and 14 characters.");
            if (req.body.password.length < 6 || req.body.password.lengt > 40)
                return res.send("Password needs to be between 6 and 40 characters.");
            if (/[^\w ]+/.test(req.body.username))
                return res.send("Username does not match pattern. Please only use letters and numbers.");
            if (!base.captchas.some((v: Captcha) => v.captcha === req.body["captcha-input"]))
                return res.send("Wrong captcha!");

            const testQuery: any = await base.db.get("SELECT * FROM accounts WHERE upper(username) = ?", req.body.username.toUpperCase());
            if (testQuery)
                return res.send("Username is already taken.");

            const hash: string = bcrypt.hashSync(req.body.password, 10);

            base.db.prepare("INSERT INTO accounts VALUES (?, ?, 1000, ?, 0, 0, 0, 0, 'blobowo', 'blobowo', null, 0, 0)")
                .then((v: any) => v.run([
                    req.body.username,
                    hash,
                    Date.now()
                ]))
                .then(() => {
                    res.send("Account successfully created! Redirecting in 5 seconds...<script>setTimeout(()=>document.location.href='/',5000);</script>");
                })
                .catch((err: any) => {
                    res.status(500).send("An error occurred on the server while trying to create account: " + err);
                });
        });
        this.app.get("/", (req: express.Request, res: express.Response) => {
            readFile("./public/index.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });
                res.send(r);
            });
        });
        this.app.get("/game", (req: express.Request, res: express.Response) => {
            readFile("./public/game.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });
                res.send(r);
            });
        });
    }
}