const { appendFileSync } = require("fs");
const Base = require("../../Base");

module.exports = class executeSQL {
    static async run(...data) {
        const [req, res] = data;
        res.set("Content-Type", "application/json");
        if (typeof req.headers.sessionid !== "string" || typeof req.headers.query !== "string") {
            res.set("status", 400);
            res.send({
                message: "Either sessionid or query header is not a string."
            });
            return;
        }
        const requester = Base.sockets.find(v => v.sessionid === req.headers.sessionid);
        if (typeof requester === "undefined") {
            res.set("status", 400);
            res.send({
                message: "Invalid sessionid was provided."
            });
            return;
        }
        if(requester.role !== 1) {
            res.set("status", 403);
            res.send({
                message: "You are not allowed to execute SQL queries."
            });
            return;
        }
        let result;
        try {
            result = await Base.sqlite[req.params.method](req.headers.query);
        } catch(e) {
            res.set("status", 500);
            res.send({
                message: "An error occured on the server. Perhaps there's a syntax error in your query?",
                error: e.toString()
            });
            return;
        }
	appendFileSync("logs.txt", `[${new Date().toLocaleString()}] ${requester.username} executed: ${req.headers.query}\n`);
	res.set("status", 200);
        res.send({result});
    }

    static get info() {
        return {
            path: "executeSQL/:method",
            category: "executeSQL"
        }
    }
};
