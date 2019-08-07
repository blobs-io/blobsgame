"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var getDatabase = /** @class */ (function () {
    function getDatabase() {
    }
    getDatabase.run = function (req, res, base) {
        if (req.query.token !== base.dbToken) {
            res.status(401).json({
                message: "Invalid token"
            });
            return;
        }
        else {
            fs_1.readFile(base.dbPath || "./db.sqlite", function (error, file) {
                if (error)
                    return res.status(500).json({
                        message: "An error occured on the server"
                    });
                else
                    res.send(file);
            });
        }
    };
    getDatabase.route = {
        path: "/db.sqlite"
    };
    return getDatabase;
}());
exports["default"] = getDatabase;
