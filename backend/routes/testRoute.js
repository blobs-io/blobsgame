"use strict";
exports.__esModule = true;
var getDatabase = /** @class */ (function () {
    function getDatabase() {
    }
    getDatabase.run = function (req, res, base) {
        res.send("\n            <html>\n                <head>\n                    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js\"></script>\n                </head>\n                <script>\n                    const socket = io.connect(\"http://127.0.0.1:3000\");                \n                </script>\n            </html>\n        ");
    };
    getDatabase.route = {
        path: "/testroute"
    };
    return getDatabase;
}());
exports["default"] = getDatabase;
