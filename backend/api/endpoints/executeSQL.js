const Base = require("../../Base");

module.exports = class executeSQL {
    static async run(...data) {
        const [req, res] = data;
        if (typeof req.headers.sessionid !== "string" || typeof req.headers.query !== "string") {
            res.set("status", 400);
            res.set("Content-Type", "application/json");
            res.send({
                message: "Either sessionid or query header is not a string."
            });
            return;
        }
        const requester = Base.sockets.find(v => v.sessionid === req.headers.sessionid);
        if (typeof requester === "undefined") {
            res.set("status", 400);
            res.set("Content-Type", "application/json");
            res.send({
                message: "Invalid sessionid was provided."
            });
            return;
        }
        if(requester.role !== 1) {
            res.set("status", 403);
            res.set("Content-Type", "application/json");
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
            res.set("Content-Type", "application/json");
            res.send({
                message: "An error occured on the server. Perhaps there's a syntax error in your query?",
                error: e.toString()
            });
            return;
        }
        res.set("status", 200);
        res.set("Content-Type", "application/json");
        res.send({result});
    }

    static get info() {
        return {
            path: "executeSQL/:method",
            category: "executeSQL"
        }
    }
};
