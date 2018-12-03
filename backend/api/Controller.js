const fs = require("fs");

module.exports = class APIController {
	constructor(app, route = "/api/") {
		if (typeof route !== "string" || typeof app === "undefined") throw new ReferenceError("Please pass a route string and an express app object as constructor parameter.");
		this.routes = fs.readdirSync(__dirname + "/endpoints/").map(v => {
			const endpoint = require(`./endpoints/${v}`);
			return Object.assign(endpoint.info, {run: endpoint.run})
		});
		this.app = app;
		this.route = route;
	}
	
	init(httpm) {
		for(const endpoint of this.routes) {
			this.app[httpm](this.route + endpoint.path, (...data) => endpoint.run(...data));
		}
	}
};
