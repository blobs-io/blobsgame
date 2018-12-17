const Base = require("./Base.js");
const fetch = require("node-fetch");
const formdata = require("form-data");

module.exports = class Logger {
    constructor(discordAuth = {}, requests = { total:0, htmlOnly: 0, ffa:0 }) {
        this._requests = requests;
        this.sessionRequests = {};
        for (const property in requests) {
            if (!this.sessionRequests.hasOwnProperty(property)) this.sessionRequests[property] = requests[property];
        }
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
        if (this.discordAuth.id === undefined || this.discordAuth.token === undefined) return;
        const data = await Base.sqlite.all("SELECT * FROM logs");
        const form = new formdata();
        form.append("content", `__${new Date().toLocaleString()}__\nTotal requests: ${data.find(v => v.name === "total").amount.toLocaleString().replace(/\./g, ",")}\nTotal FFA requests: ${data.find(v => v.name === "ffa").amount.toLocaleString().replace(/\./g, ",")}\nHTML-only requests: ${data.find(v => v.name === "htmlOnly").amount.toLocaleString().replace(/\./g, ",")}\n\nTotal session requests: ${this.sessionRequests.total.toLocaleString().replace(/\./g, ",")}\nTotal session FFA requests: ${this.sessionRequests.ffa.toLocaleString().replace(/\./g, ",")}\nTotal HTML-only session requests: ${this.sessionRequests.htmlOnly.toLocaleString().replace(/\./g, ",")}`);
        const request = await fetch(`https://discordapp.com/api/webhooks/${this.discordAuth.id}/${this.discordAuth.token}`, {
            method: "POST",
            body: form
        });
        return request;
    }

    async log(requests = this.requests) {
        const result = await Base.sqlite.all("SELECT * FROM logs");
        for (const key in this.requests) {
			if (!result.some(v => v.name === key)) {
				await Base.sqlite.prepare("INSERT INTO logs VALUES (?, 0)").then(v => v.run([key]));
			}
			await Base.sqlite.prepare("UPDATE logs SET amount = amount + ? WHERE name=?").then(v => v.run([ requests[key], key ]));
			this.requests[key] = 0;
		}
        return requests;
    }
};
