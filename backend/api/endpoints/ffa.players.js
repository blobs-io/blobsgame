const Base = require("../../Base");

module.exports = class Players {
	static run(...data) {
		const [req, res] = data;
		res.set("status", 200);
		res.json(Base.rooms.find(v => v.id === "ffa").players.map(v => Object.assign(v, {x: v.x, y: v.y})));
	}
	
	static get info() {
		return {
			path: "ffa/players",
			category: "ffa"
		};
	}
};
