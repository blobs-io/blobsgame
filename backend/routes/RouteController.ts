// Imports
import Base from "../structures/Base";
import * as express from "express";
import * as SessionIDManager from "../structures/SessionIDManager";
import {readFile, appendFile, existsSync} from "fs";
import * as bcrypt from "bcrypt";
import Captcha from "../structures/Captcha";
import { Role } from "../models/Player";
import Database from "../structures/Database";

// Used for listening to requests that are related to regular routing (normal pages)
export default class RouteController {
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
        // Destructure object so `base` can be used instead of `this.base`
        const { base } = this;

        // GET /app
        // Returns the landing page for after logging in
        // On this page, a daily bonus can be requested every 24h, a room can be joined or the current blob can be switched
        this.app.get("/app", async (req: express.Request, res: express.Response) => {
            if (!base.db) return;
            const { session } = req.cookies;
            if (!session)
                return res.send("<script>document.location.href='/login?nr';</script>");

            const dbSession: any = await SessionIDManager.getSession(base.db, {
                type: "session",
                value: session
            });
            if (!dbSession)
                return res.send("<script>document.location.href='/login?nr';</script>");
            const user: any = await base.db.query(`SELECT * FROM accounts WHERE "username" = $1`, [dbSession.username]).then((v: any) => v.rows[0]);
            const promotions: any = await base.db.query(`SELECT * FROM recentPromotions ORDER BY "promotedAt" DESC LIMIT 10`).then((v: any) => v.rows);
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
                        .replace(/\[!XP]/g, user.xp)
                );
            });
        });

        // GET /db.sqlite
        // WARNING: This route may ONLY be accessed by people who have permissions to view the database
        // You are required to authorize by using a 45-characters long database token 
        // that is logged to the console when the process is started as GET parameter `token`
        this.app.get("/db.sqlite", async (req: express.Request, res: express.Response) => {
            if (!this.base.db) return;
            if (req.query.auth === "cookie") {
                const { session } = req.cookies;

                if (!session) {
                    try {
                        RouteController.displayStaticError("403", res);
                    } catch (e) {
                        res.status(500).send(String(e));
                    }
                    return;
                }

                const dbSession: any = await SessionIDManager.getSession(this.base.db, {
                    type: "session",
                    value: session
                });

                if (!dbSession) {
                    try {
                        RouteController.displayStaticError("400", res);
                    } catch (e) {
                        res.status(500).send(String(e));
                    }
                    return;
                }

                const { role } = await this.base.db.query(`SELECT "role" FROM accounts WHERE username = $1`, [dbSession.username]).then((v: any) => v.rows[0]);

                if (role !== 1) {
                    try {
                        RouteController.displayStaticError("403", res);
                    } catch (e) {
                        res.status(500).send(String(e));
                    }
                    return;
                }
                readFile(base.dbPath || "./db.sqlite", (error, file) => {
                    if (error) return res.status(500).json({
                        message: "An error occured on the server"
                    });
                    else res.send(file);
                });
                return;
            } else if (req.query.auth === "token" && req.query.token === base.dbToken) {
                readFile(base.dbPath || "./db.sqlite", (error, file) => {
                    if (error) return res.status(500).json({
                        message: "An error occured on the server"
                    });
                    else res.send(file);
                });
                return;
            } else {
                try {
                    RouteController.displayStaticError("403", res);
                } catch(e) {
                    res.status(500).send(String(e));
                }
            }
        });

        // GET /login
        // Returns the login page
        this.app.get("/login", (req: express.Request, res: express.Response) => {
            readFile("./public/login.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });
                res.send(r);
            });
        });

        // POST /login
        // Validates login data, sets a session cookie when successfully logged in and stores session ID
        this.app.post("/login", async (req: express.Request, res: express.Response) => {
            if (!base.db) return;
            const { username, password } = req.body;
            if (!username || !password || typeof username !== "string" || typeof password !== "string")
                return readFile("./public/login.html", "utf8", (err: any, data: any) => {
                    res.send("<script>alert('Please enter your username and password.');</script>" + data);
                });

            const banned: { is: boolean, reason?: string, expires?: number } = {
                is: false
            };
            
            const banQuery = await base.db.query(`SELECT "reason", "expires" FROM bans WHERE username = $1`, [username]).then((v: any) => v.rows[0]);
            if (banQuery) {
                if (Date.now() > Number(banQuery.expires)) {
                    await base.db.query("DELETE FROM bans WHERE username = $1", [username]);
                } else {
                    banned.is = true;
                    banned.reason = banQuery.reason;
                    banned.expires = Number(banQuery.expires);
                }
            }
            
            if (banned.is && banned.expires)
                return readFile("./public/login.html", "utf8", (err: any, data: any) => {
                    res.send("<script>alert('You are banned: " + banned.reason + "\\nExpires: " + new Date(Number(banned.expires)).toLocaleString() + "');</script>" + data);
                });

            base.db.query("SELECT * FROM accounts WHERE upper(username) = $1", [username.toUpperCase()])
                .then((v: any) => v.rows[0])
                .then(async (result: any) => {
                    if (!result)
                        return readFile("./public/login.html", "utf8", (err: any, data: any) => {
                            res.send("<script>alert('Invalid username or password.');</script>" + data);
                        });
                    if (!bcrypt.compareSync(password, result.password))
                        return readFile("./public/login.html", "utf8", (err: any, data: any) => {
                            res.send("<script>alert('Invalid username or password.');</script>" + data);
                        });

                    const sessionExists: boolean = await SessionIDManager.exists(<Database>base.db, {
                        type: "username",
                        value: username
                    });

                    if (sessionExists)
                        await SessionIDManager.deleteSession(<Database>base.db, {
                            type: "username",
                            value: username
                        });

                    const sessionID: string = await SessionIDManager.registerID(<Database>base.db, username)


                    // Successfully logged in
                    res.send(`
                        <script>
                            document.cookie = "session=${sessionID};expires=${new Date(Date.now() + 9e5).toUTCString()};path=/";
                            document.location.href = "/app";
                        </script>
                    `)
                });
        });

        // GET /register
        // Returns the registration page
        this.app.get("/register", (req: express.Request, res: express.Response) => {
            readFile("./public/register.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });
                res.send(r);
            });
        });

        // POST /register
        // Validates registration data and sets a cookie if successful registration
        this.app.post("/register", async (req: express.Request, res: express.Response) => {
            if (!base.db) return;
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

            const testQuery: any = await base.db.query("SELECT * FROM accounts WHERE upper(username) = $1", [req.body.username.toUpperCase()]).then((v: any) => v.rows[0]);
            if (testQuery)
                return readFile("./public/register.html", "utf8", (err: any, data: any) => {
                    res.send("<script>alert('Username is already taken.');</script>" + data);
                });

            const hash: string = bcrypt.hashSync(req.body.password, 10);

            await base.db.query(`
                INSERT INTO accounts 
                ("username", "password", "br", "createdAt", "role", "blobcoins", "lastDailyUsage", "distance", "blobs", "activeBlob", "clan", "wins", "losses", "xp")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `, [
                req.body.username,
                hash,
                // TODO: use constants instead of hardcoded values
                // should be added to user model (if we ever get to that point...)
                1000,
                Date.now(),
                Role.USER,
                0,
                0,
                0,
                "blobowo",
                "blobowo",
                null,
                0,
                0,
                0
            ])
                .then(() => {
                    res.send("Account successfully created! Redirecting in 5 seconds...<script>setTimeout(()=>document.location.href='/',5000);</script>");
                })
                .catch((err: any) => {
                    return readFile("./public/register.html", "utf8", (error: any, data: any) => {
                        res.send("<script>alert('A server error occurred: " + err + "');</script>" + data);
                    });
                });
        });

        // GET /
        // Returns the main page when accessing the website
        this.app.get("/", (req: express.Request, res: express.Response) => {
            readFile("./public/index.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });
                res.send(r);
            });
        });

        // GET /game
        // Returns the game page (only HTML)
        this.app.get("/game", (req: express.Request, res: express.Response) => {
            readFile("./public/game.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });
                res.send(r);
            });
        });

        // GET /sources
        // Returns a page that lists all sources
        // If you are the owner of one of the used graphics and want me/us to remove it, please contact the maintainer
        this.app.get("/sources", (req: express.Request, res: express.Response) => {
            readFile("./public/sources.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });
                res.send(r);
            });
        });

        // GET /verify
        // Returns a page where an authenticated user may link their Discord account
        this.app.get("/verify", async (req: express.Request, res: express.Response) => {
            if (!this.base.db) return;
            const { session } = req.cookies;
            if (!session)
                return res.send("<script>document.location.href='/login';</script>");

            const dbSession: any = await SessionIDManager.getSession(<Database>base.db, {
                type: "session",
                value: session
            });

            readFile("./public/verify.html", "utf8", (error: any, data: string) => {
                res.send(
                    data.replace(/\[!USERNAME]/g, dbSession.username)
                );
            });
        });

        // GET /cms
        // Returns the content management system page where administrators can access the database
        this.app.get("/cms", async (req: express.Request, res: express.Response) => {
            if (!this.base.db) return;
            const { session } = req.cookies;

            if (!session) {
                try {
                    RouteController.displayStaticError("403", res);
                } catch (e) {
                    res.status(500).send(String(e));
                }
                return;
            }

            const dbSession: any = await SessionIDManager.getSession(this.base.db, {
                type: "session",
                value: session
            });

            if (!dbSession) {
                try {
                    RouteController.displayStaticError("400", res);
                } catch (e) {
                    res.status(500).send(String(e));
                }
                return;
            }

            const { role } = await this.base.db.query(`SELECT "role" FROM accounts WHERE username = $1`, [dbSession.username]).then((v: any) => v.rows[0]);

            if (role !== 1) {
                try {
                    RouteController.displayStaticError("403", res);
                } catch (e) {
                    res.status(500).send(String(e));
                }
                return;
            }

            readFile("./backend/cms/index.html", "utf8", (err: NodeJS.ErrnoException | null, data: string) => {
                if (err) return res.send(err);
                else res.send(data);
            });
        });
    }

    static displayStaticError(code: string, res: express.Response): void {
        const codeNum: number = parseInt(code, 10);
        if (isNaN(codeNum)) throw new TypeError("Argument code needs to be type of number");
        if (existsSync(`./public/error/${code}.html`)) {
            readFile(`./public/error/${code}.html`, "utf8", (err: NodeJS.ErrnoException | null, data: string) => {
                if (err) {
                    throw new Error("Could not read file.");
                }
                res.status(codeNum).send(data);
            });
        }
    }
}