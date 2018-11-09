const Base = require("../../Base");

module.exports = class Players {
	static run(...data) {
		const [req, res] = data;
		res.send(Base.gamemodes.ffa.players.map(v => Object.assign(v, {id: undefined, _directionChange: undefined, img: undefined, ready: true})));
	}
	
	static get info() {
		return {
			path: "ffa/players",
			category: "ffa"
		}
	}
};
