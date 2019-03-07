const { sqlite } = require("../../Base");

module.exports = class ClanList {
	static async run(...data) {
		const [req, res] = data;
		sqlite.all("select members, cr, name from clans order by cr desc limit 10").then(r => {
			res.json(r);
		});
	}
	
	static get info() {
		return {
			path: "clans/list",
			category: undefined
		}
	}
};
