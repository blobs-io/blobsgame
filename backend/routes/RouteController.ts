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
                return readFile("./public/login.html", "utf8", (err: any, data: any) => {
                    res.send("<script>alert('Please enter your username and password.');</script>" + data);
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
                return readFile("./public/login.html", "utf8", (err: any, data: any) => {
                    res.send("<script>alert('You are banned: " + banned.reason + "\\nExpires: " + new Date(Number(banned.expires)).toLocaleString() + "');</script>" + data);
                });

            base.db.prepare("SELECT * FROM accounts WHERE username = ?")
                .then((prepare: any) => prepare.get([ username ]))
                .then(async (result: any) => {
                    if (!result)
                        return readFile("./public/login.html", "utf8", (err: any, data: any) => {
                            res.send("<script>alert('Invalid username or password.');</script>" + data);
                        });
                    if (!bcrypt.compareSync(password, result.password))
                        return readFile("./public/login.html", "utf8", (err: any, data: any) => {
                            res.send("<script>alert('Invalid username or password.');</script>" + data);
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
                return readFile("./public/register.html", "utf8", (err: any, data: any) => {
                    res.send("<script>alert('Please enter a username, password and the given captcha.');</script>" + data);
                });
            if (req.body.username.length < 3 || req.body.username.length > 14)
                return readFile("./public/register.html", "utf8", (err: any, data: any) => {
                    res.send("<script>alert('Username needs to be at least 3 characters long and must not be longer than 14 characters.');</script>" + data);
                });
            if (req.body.password.length < 6 || req.body.password.lengt > 40)
                return readFile("./public/register.html", "utf8", (err: any, data: any) => {
                    res.send("<script>alert('Password needs to be at least 6 characters long and must not be longer than 40 characters.');</script>" + data);
                });
            if (/[^\w ]+/.test(req.body.username))
                return readFile("./public/register.html", "utf8", (err: any, data: any) => {
                    res.send("<script>alert('Username does not match pattern. Please only use numbers and letters.');</script>" + data);
                });
            if (!base.captchas.some((v: Captcha) => v.captcha === req.body["captcha-input"]))
                return readFile("./public/register.html", "utf8", (err: any, data: any) => {
                    res.send("<script>alert('Wrong captcha.');</script>" + data);
                });

            const testQuery: any = await base.db.get("SELECT * FROM accounts WHERE upper(username) = ?", req.body.username.toUpperCase());
            if (testQuery)
                return readFile("./public/register.html", "utf8", (err: any, data: any) => {
                    res.send("<script>alert('Username is already taken.');</script>" + data);
                });

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
                    return readFile("./public/register.html", "utf8", (err: any, data: any) => {
                        res.send("<script>alert('A server error occurred: " + err + "');</script>" + data);
                    });
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
        this.app.get("/sources", (req: express.Request, res: express.Response) => {
            readFile("./public/sources.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });
                res.send(r);
            });
        });
    }
}