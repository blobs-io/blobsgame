"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs_1 = require("fs");
var bcrypt = require("bcrypt");
var SessionIDManager = require("../structures/SessionIDManager");
var Root = /** @class */ (function () {
    function Root() {
    }
    Root.run = function (req, res, base, method) {
        if (method === void 0) { method = "get"; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, username_1, password_1, banned_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(method === "get")) return [3 /*break*/, 1];
                        fs_1.readFile("./public/login/index.html", "utf8", function (e, r) {
                            if (e)
                                return res.status(500).json({
                                    message: "An error occurred on the server (could not read file)"
                                });
                            res.send(r);
                        });
                        return [3 /*break*/, 3];
                    case 1:
                        if (!(method === "post")) return [3 /*break*/, 3];
                        _a = req.body, username_1 = _a.username, password_1 = _a.password;
                        if (!username_1 || !password_1 || typeof username_1 !== "string" || typeof password_1 !== "string")
                            return [2 /*return*/, res.status(401).json({
                                    message: "Please enter a valid username and password."
                                })];
                        banned_1 = {
                            is: false
                        };
                        return [4 /*yield*/, base.db.prepare("SELECT reason, expires FROM bans WHERE username = ?").then(function (prepare) {
                                prepare.get([username_1]).then(function (result) {
                                    if (typeof result === "undefined")
                                        return;
                                    if (Date.now() > Number(result.expires))
                                        return base.db.prepare("DELETE FROM bans WHERE username=?")
                                            .then(function (prepared) { return prepared.run([username_1]); });
                                    banned_1.is = true;
                                    banned_1.reason = result.reason;
                                    banned_1.expires = Number(result.expires);
                                });
                            })];
                    case 2:
                        _b.sent();
                        if (banned_1.is && banned_1.expires)
                            return [2 /*return*/, res.status(403).json({
                                    message: "You have been banned.",
                                    reason: banned_1.reason,
                                    expires: new Date(banned_1.expires).toLocaleString()
                                })];
                        base.db.prepare("SELECT * FROM accounts WHERE username = ?")
                            .then(function (prepare) { return prepare.get([username_1]); })
                            .then(function (result) { return __awaiter(_this, void 0, void 0, function () {
                            var sessionExists, sessionID;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!result)
                                            return [2 /*return*/, res.status(401).json({
                                                    message: "Invalid username or password."
                                                })];
                                        if (!bcrypt.compareSync(password_1, result.password))
                                            return [2 /*return*/, res.status(401).json({
                                                    message: "Wrong password."
                                                })];
                                        return [4 /*yield*/, SessionIDManager.exists(base.db, {
                                                type: "username",
                                                value: username_1
                                            })];
                                    case 1:
                                        sessionExists = _a.sent();
                                        if (!sessionExists) return [3 /*break*/, 3];
                                        return [4 /*yield*/, SessionIDManager.deleteSession(base.db, {
                                                type: "username",
                                                value: username_1
                                            })];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3: return [4 /*yield*/, SessionIDManager.registerID(base.db, username_1)
                                        // Successfully logged in
                                    ];
                                    case 4:
                                        sessionID = _a.sent();
                                        // Successfully logged in
                                        res.send("\n                        <script>\n                            document.cookie = \"session=" + sessionID + ";expires=" + new Date(Date.now() + 9e5).toUTCString() + ";path=/\";\n                            document.location.href = \"/app\";\n                        </script>\n                    ");
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Root.route = {
        path: "/login"
    };
    return Root;
}());
exports["default"] = Root;
