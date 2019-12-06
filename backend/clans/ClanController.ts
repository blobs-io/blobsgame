// Imports
import * as express from "express";
import { readFileSync } from "fs";
import Clan from "../structures/Clan";

// Used for listening to requests that are related to clans
export default class ClanController {
    // A reference to the express router
    public app: express.Application;
    // A reference to the SQLite driver (base.db)
    public db: any;
    // Maximum number of members a clan can have
    public static MemberLimit: number = 20;

    constructor(app: express.Application, db: any) {
        // Assign local variables to object
        this.app = app;
        this.db = db;
    }

    // This function may only be called once
    // It creates listeners for every endpoint
    public listen(): void {
        // GET /clans/
        // Returns the clans page (a list of some existing clans)
        this.app.get("/clans/", (req: express.Request, res: express.Response) => {
            res.send(
                readFileSync(__dirname + "/index_anon_templ.html", "utf8")
            );
        });

        // GET /clans/view/:clan
        // Retrieve information about a specific clan
        this.app.get("/clans/view/:clan", async (req: express.Request, res: express.Response) => {
            if (Array.isArray(req.params)) return;
            if (!req.params.clan) return res.send("Please specify a clan");
            const clan: Clan | undefined = await this.db.get("SELECT * FROM clans WHERE name=?", req.params.clan);
            if (!clan) return res.send("Clan was not found");
            res.send(
                readFileSync(__dirname + "/clan_view_anon_templ.html", "utf8")
                    .replace(/{leader}/g, clan.leader)
                    .replace(/{cr}/g, clan.cr.toString())
                    .replace(/{members}/g, clan.members.split(",").join(", ").slice(1, -1))
                    .replace(/{description}/g, (clan.description || "-")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;"))
            );
        });
    }
}