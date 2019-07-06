import Base from "./Base";
import * as fetch from "node-fetch";
import FormData = require("form-data");

export interface DiscordAuthentication {
    id: string;
    token: string;
}

interface Requests {
    total: number;
    htmlOnly: number;
    ffa: number;
    [key: string]: any;
}

interface RequestsTableEntry {
    name: string;
    amount: number;
}

export default class Logger {
    public requests: Requests;
    public sessionRequests: Requests;
    public discordAuth: DiscordAuthentication | undefined;
    public base: Base;

    constructor(base: Base, discordAuth?: DiscordAuthentication, requests: Requests = {
        total: 0,
        htmlOnly: 0,
        ffa: 0
    }) {
        this.requests = requests;
        this.sessionRequests = {
            total: 0,
            htmlOnly: 0,
            ffa: 0
        };
        this.discordAuth = discordAuth;
        this.base = base;
    }

    /**
     * Stores requests in database every `ms` milliseconds
     *
     * @param {function} callback The callback function
     * @param {number} ms Milliseconds
     */
    setInterval(callback: ((...data: Array<any>) => any) | undefined, ms: number) {
        setInterval(() => {
            this.log().then((...data) => {
                if (typeof callback === "function")
                    callback(...data);
            });
        }, ms);
    }

    /**
     * Posts data to Discord with supplied token/id
     *
     * @returns {Promise<Response>}
     */
    async postToDiscord(): Promise<fetch.Response | undefined> {
        if (!this.discordAuth) return;
        const data: Array<RequestsTableEntry> = await this.base.db.all("SELECT * FROM logs");
        const form = new FormData();
        // @ts-ignore
        form.append("content", `__${new Date().toLocaleString()}__\nTotal requests: ${data.find(v => v.name === "total").amount.toLocaleString().replace(/\./g, ",")}\nTotal FFA requests: ${data.find(v => v.name === "ffa").amount.toLocaleString().replace(/\./g, ",")}\nHTML-only requests: ${data.find(v => v.name === "htmlOnly").amount.toLocaleString().replace(/\./g, ",")}\n\nTotal session requests: ${this.sessionRequests.total.toLocaleString().replace(/\./g, ",")}\nTotal session FFA requests: ${this.sessionRequests.ffa.toLocaleString().replace(/\./g, ",")}\nTotal HTML-only session requests: ${this.sessionRequests.htmlOnly.toLocaleString().replace(/\./g, ",")}`)
        const request: fetch.Response = await fetch.default(`https://discordapp.com/api/webhooks/${this.discordAuth.id}/${this.discordAuth.token}`, {
            method: "POST",
            body: form
        });
        return request;
    }

    /**
     * Updates `logs` table in database
     *
     * @returns {Promise<Array<RequestsTableEntry>>}
     */
    async log(): Promise<Array<RequestsTableEntry>> {
        const data: Array<RequestsTableEntry> = await this.base.db.all("SELECT * FROM logs");
        for (const key in this.requests) {
            if (!data.some(v => v.name === key)) {
                await this.base.db.prepare("INSERT INTO logs VALUES (?, 0)").then((v: any) => v.run([key]));
            }
            await this.base.db.prepare("UPDATE logs SET amount = amount + ? WHERE name=?").then((v: any) => v.run([ this.requests[key], key ]));
            this.requests[key] = 0;
        }
        return data;
    }
}