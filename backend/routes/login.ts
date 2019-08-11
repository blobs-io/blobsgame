import RouteInformation from "../structures/Route";
import Base from "../structures/Base";
import { readFile } from "fs";
import * as bcrypt from "bcrypt";
import * as SessionIDManager from "../structures/SessionIDManager";

export default class Root {
    static route: RouteInformation = {
        path: "/login"
    };

    static async run(req: any, res: any, base: Base, method: string = "get"): Promise<void> {
        if (method === "get") {
            readFile("./public/login/index.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });

                res.send(r);
                setTimeout(() => {
                    console.log("sup");
                }, 20000);
            });
        } else if (method === "post") {
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
                    `);
                });
        }
    }
}