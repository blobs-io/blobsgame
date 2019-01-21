const Base = require("../../Base");

module.exports = class Player {
	static async run(...data) {
		const [req, res] = data;
		res.set("content-type", "application/json");
		if (typeof req.params.username === "username") {
			res.set("status", 400);
			res.send({
				message: "No username provided."
			});
			return;
		}
		const result = await Base.sqlite.prepare("SELECT username, br, createdAt, role FROM accounts WHERE username=?").then(v => v.get([req.params.username]));
		if (typeof result === "undefined") {
			res.set("status", 400);
			res.send({
				message: "User not found"
			});
			return;
		}
		res.set("status", 200);
		res.send({ result });
	}
	
	static get info() {
		return {
			path: "player/:username",
			category: "player"
		};
	}
};
