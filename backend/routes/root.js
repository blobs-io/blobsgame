"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var Root = /** @class */ (function () {
    function Root() {
    }
    Root.run = function (req, res, base) {
        fs_1.readFile("./public/index.html", "utf8", function (e, r) {
            if (e)
                return res.status(500).json({
                    message: "An error occurred on the server (could not read file)"
                });
            res.send(r);
        });
    };
    Root.route = {
        path: "/"
    };
    return Root;
}());
exports["default"] = Root;
