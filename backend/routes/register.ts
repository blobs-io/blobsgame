import RouteInformation from "../structures/Route";
import Base from "../structures/Base";
import { readFile } from "fs";
import * as bcrypt from "bcrypt";
import * as SessionIDManager from "../structures/SessionIDManager";
import Captcha from "../structures/Captcha";

export default class Root {
    static route: RouteInformation = {
        path: "/register"
    };

    static async run(req: any, res: any, base: Base, method: string = "get"): Promise<void> {
        if (method === "get") {
            readFile("./public/register/index.html", "utf8", (e, r) => {
                if (e) return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });

                res.send(r);
            });
        } else if (method === "post") {
            if (typeof req.body.username !== "string" || typeof req.body.password !== "string" || typeof req.body["captcha-input"] !== "string")
                return res.send("Username, password and captcha need to be set."); // TODO: better error
            // TODO: Remove captcha from base.captchas; no longer required
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
        }
    }
}