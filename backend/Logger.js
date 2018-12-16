const Base = require("./Base.js");

module.exports = class Logger {
    constructor(requests = { total:0, htmlOnly: 0, ffa:0 }) {
        this._requests = requests;
    }

    get requests() {
        return this._requests;
    }

    set requests(value) {
        return this._requests = value;
    }

    setInterval(callback, ms) {
        setInterval(() => {
            this.log().then(callback);
        }, ms || 1000);
    }

    async log(requests = this.requests) {
        const result = await Base.sqlite.all("SELECT * FROM logs");
        if (!result.some(v => v.name === "total")) {
            await Base.sqlite.run("INSERT INTO logs VALUES ('total', 0)");
        }
        if (!result.some(v => v.name === "ffa")) {
            await Base.sqlite.run("INSERT INTO logs VALUES ('ffa', 0)");
        }
        if (!result.some(v => v.name === "htmlOnly")) {
            await Base.sqlite.run("INSERT INTO logs VALUES ('htmlOnly', 0)");
        }
        await Base.sqlite.prepare("UPDATE logs SET amount=? WHERE name=?").then(v => v.run([ requests.total, "total" ]));
        await Base.sqlite.prepare("UPDATE logs SET amount=? WHERE name=?").then(v => v.run([ requests.ffa, "ffa" ]));
        await Base.sqlite.prepare("UPDATE logs SET amount=? WHERE name=?").then(v => v.run([ requests.htmlOnly, "htmlOnly" ]));
        return requests;
    }
};