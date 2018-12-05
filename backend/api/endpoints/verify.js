const Base = require("../../Base");
const { generateSessionID } = require("../../SessionIDManager");

module.exports = class executeSQL {
    static async run(...data) {
        const [req, res] = data;
        res.set("Content-Type", "application/json");
        if (typeof req.headers.code === "undefined") {
            if (typeof req.headers.sessionid === "undefined") {
                res.set("status", 400);
                res.send({
                    message: "sessionid header is not set"
                });
                return;
            }
            const requester = Base.sockets.find(v => v.sessionid === req.headers.sessionid);
            if (typeof requester === "undefined") {
                res.set("status", 403);
                res.send({
                    message: "Invalid sessionid was provided"
                });
                return;
            }

            if (req.query.request === "true") {
                const prepared = await Base.sqlite.prepare("SELECT code FROM verifications WHERE user=?");
                const query = await prepared.get([ requester.username ]);
                if (typeof query === "undefined") {
                    query.set("status", 400);
                    res.send({
                        message: "User did not request a verification code"
                    });
                    return;
                }

                res.set("status", 200);
                res.send({
                    code: query.code
                });
                return;
            }
            const prepared = await Base.sqlite.prepare("SELECT * FROM verifications WHERE user=?");
            if (typeof (await prepared.get([requester.username])) !== "undefined") { // forgive me for writing such code
                res.set("status", 403);
                res.send({
                    message: "User already requested a verification code"
                });
                return;
            } else {
                let verificationCode;
                for(;;) {
                    verificationCode = generateSessionID(16);
                    if (typeof (await (Base.sqlite.get("SELECT code FROM verifications WHERE code='" + verificationCode + "'")) === "undefined")) break;
                }
                const prepare = await Base.sqlite.prepare("INSERT INTO verifications VALUES (?, ?, ?)");
                await prepare.run([ requester.username,  verificationCode, Date.now() ]);
                res.set("status", 200);
                res.send({
                    code: verificationCode
                });
            }
        } else if (typeof req.headers.code === "string") {
            const prepare = await Base.sqlite.prepare("SELECT user FROM verifications WHERE code=?");
            const result = await prepare.get([ req.headers.code ]);
            if (typeof result === "undefined") {
                res.set("status", 400);
                res.send({
                    message: "code was not found"
                });
                return;
            }
            await Base.sqlite.prepare("DELETE FROM verifications WHERE code=?").then(prepared => prepared.run([ req.headers.code ]));
            res.set("status", 200);
            res.send({
                user: result.user
            });
        } else {
            res.set("status", 400);
            res.send({
                message: "code header is not a string"
            });
        }
    }

    static get info() {
        return {
            path: "verify",
            category: "verify"
        }
    }
};
