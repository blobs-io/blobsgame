const { readFileSync } = require("fs");

module.exports = class ClanManager {
	constructor(app, db) {
		this._app = app;
		this._db = db;
		this._clans = [];
	}
	
	get app() { return this._app; }
	get db() { return this._db; }
	get clans() { return this._clans; }
	set app(v) { return this._app = v; }
	set db(v) { return this._db = v; }
	set clans(v) { return this._clans = v; }
	
	initRoute(route = "/clans/") {
		this.app.get(route, (req, res) => {
			res.send(readFileSync(__dirname + "/index_anonymous.html", "utf8"));
		});
		
		this.app.get(route + "view/:clan", async (req, res) => {
			const clan = await (await this.db.prepare("SELECT * FROM clans WHERE name=?")).get([req.params.clan]);
			if (!clan) return res.send("Clan not found");
			res.send(readFileSync(__dirname + "/clan_view_anonymous.html", "utf8")
					 .replace(/\{leader\}/g, clan.leader)
					 .replace(/\{cr\}/g, clan.cr)
					 .replace(/\{members\}/g, clan.members.split(",").join(", "))
					 .replace(/\{description\}/g, (clan.description || "-").replace(/</g, "&lt;").replace(/>/g, "&gt;")));
		});
	}
}
