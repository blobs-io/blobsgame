const Base = require("../../Base");

module.exports = class Players {
	static run(...data) {
		const [req, res] = data;
		res.set("status", 200);
		res.json(Base.rooms.find(v => v.id === "ffa").players);
	}
	
	static get info() {
		return {
			path: "ffa/players",
			category: "ffa"
		};
	}
};
