const Base = require("./Base.js");
const fetch = require("node-fetch");
const formdata = require("form-data");

module.exports = class Logger {
    constructor(discordAuth = {}, requests = { total:0, htmlOnly: 0, ffa:0 }) {
        this._requests = requests;
        this.discordAuth = discordAuth;
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

    async postDiscord() {
        const data = await Base.sqlite.all("SELECT * FROM logs");
        const form = new formdata();
        form.append("content", `**Total requests:** ${data.find(v => v.name === "total").amount}\n**Total FFA requests:** ${data.find(v => v.name === "ffa").amount}\n**HTML-only requests: **${data.find(v => v.name === "htmlOnly").amount}`);
        const request = await fetch(`https://discordapp.com/api/webhooks/${this.discordAuth.id}/${this.discordAuth.token}`, {
            method: "POST",
            body: form
        });
        return request;
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
        await Base.sqlite.prepare("UPDATE logs SET amount = amount + ? WHERE name=?").then(v => v.run([ requests.total, "total" ]));
        await Base.sqlite.prepare("UPDATE logs SET amount = amount + ? WHERE name=?").then(v => v.run([ requests.ffa, "ffa" ]));
        await Base.sqlite.prepare("UPDATE logs SET amount = amount + ? WHERE name=?").then(v => v.run([ requests.htmlOnly, "htmlOnly" ]));
        this.requests.total = 0;
        this.requests.ffa = 0;
        this.requests.htmlOnly = 0;
        return requests;
    }
};