class Base {};

Base.express = {
    express: require("express")
};
Base.express.app = Base.express.express();
Base.socket = require("socket.io");
Base.server = Base.express.app.listen(process.env.PORT || 3000, () => {
    console.log("App started.");
});
Base.discordAuth = {
	logWebhook: {
		id: undefined,
		token: undefined
	}
};
Base.algorith = "./b {ownbr} {opponentbr} 1";
Base.bcrypt = require("bcrypt");
Base.sqlite = require("sqlite");
Base.io = Base.socket(Base.server);
Base.sessions = require("./SessionIDManager");
Base.utils = { };
Base.captchas = Base.sockets = [ ];
Base.gamemodes = {
	ffa: {
		players: [],
		objects: {
			walls: []
		}
	}
};

// Add objects
for(let i = 0; i < 50; ++i) {
	Base.gamemodes.ffa.objects.walls.push({
		x: Math.floor(Math.random() * 2000),
		y: Math.floor(Math.random() * 2000)
	});
}

// Utilities
require("./utils/utilManager")().then(utilities => {
    for(const val of utilities){
        Base.utils[val.name] = val.method;
    }
});

module.exports = Base;
