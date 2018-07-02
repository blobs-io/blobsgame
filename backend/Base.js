class Base {};

Base.express = {
    express: require("express")
};
Base.express.app = Base.express.express();
Base.socket = require("socket.io");
Base.server = Base.express.app.listen(process.env.PORT || 3000, () => {
    console.log("App started.");
});
Base.bcrypt = require("bcrypt");
Base.sqlite = require("sqlite");
Base.express.app.use(Base.express.express.static("public"));
Base.io = Base.socket(Base.server);
Base.sessions = require("./SessionIDManager");
Base.utils = { };
Base.captchas = Base.sockets = [ ];

// Utilities
require("./utils/utilManager")().then(utilities => {
    for(const val of utilities){
        Base.utils[val.name] = val.method;
    }
});

module.exports = Base;