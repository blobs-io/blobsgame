const { sqlite } = require("../../Base");

module.exports = class Players {
	static async run(...data) {
		const [req, res] = data;
		res.json(await sqlite.all("SELECT username, br, createdAt, role FROM accounts ORDER BY br DESC LIMIT 25"));
	}
	
	static get info() {
		return {
			path: "players",
			category: undefined
		}
	}
};
