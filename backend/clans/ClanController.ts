import * as express from "express";
import { readFileSync } from "fs";
import Clan from "../structures/Clan";

export default class ClanController {
    public app: express.Application;
    public db: any;

    constructor(app: express.Application, db: any) {
        this.app = app;
        this.db = db;
    }

    listen(): void {
        this.app.get("/clans/", (req: express.Request, res: express.Response) => {
            res.send(
                readFileSync(__dirname + "/index_anonymous.html", "utf8")
            );
        });
        this.app.get("/clans/view/:clan", async (req: express.Request, res: express.Response) => {
            if (!req.params.clan) return res.send("Please specify a clan");
            const clan: Clan | undefined = await this.db.get("SELECT * FROM clans WHERE name=?", req.params.clan);
            if (!clan) return res.send("Clan was not found");
            res.send(
                readFileSync(__dirname + "/clan_view_anonymous.html", "utf8")
                    .replace(/{leader}/g, clan.leader)
                    .replace(/{cr}/g, clan.cr.toString())
                    .replace(/{members}/g, clan.members.split(",").join(", "))
                    .replace(/description/g, (clan.description || "-")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;"))
            );
        });
    }
}