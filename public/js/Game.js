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
var _this = this;
var randomNumber = function (min, max) { return Math.floor(Math.random() * (max - min) + min); };
var useSecureWS = false;
(function () {
    var canvas = document.getElementsByTagName("canvas")[0];
    var ctx = canvas.getContext("2d");
    var sessionid = (function () {
        var cookie = document.cookie.split(/; */).find(function (v) { return v.startsWith("session="); }) || "";
        return cookie.substr(cookie.indexOf("=") + 1);
    })();
    var ws = new WebSocket(server.replace(/^https?/, "ws" + (useSecureWS ? "s" : "")));
    var lastTick = Date.now();
    var blobs = [];
    var objects = {
        walls: [],
        items: [],
        images: {
            blobnom: null,
            brickwall: (function () {
                var image = new Image();
                image.src = "../../assets/brickwall.png";
                return image;
            })(),
            heart: (function () {
                var image = new Image();
                image.src = "http://icons.iconarchive.com/icons/paomedia/small-n-flat/1024/heart-icon.png";
                return image;
            })(),
            crown: (function () {
                var image = new Image();
                image.src = "../../assets/emblems/crown.png";
                return image;
            })()
        }
    };
    var scale = 1;
    var mapSize = {
        width: 2000,
        height: 2000
    };
    var border = {
        left: { from: { x: 0, y: 0, }, to: { x: 0, y: 0 } },
        right: { from: { x: 0, y: 0, }, to: { x: 0, y: 0 } },
        top: { from: { x: 0, y: 0, }, to: { x: 0, y: 0 } },
        bottom: { from: { x: 0, y: 0, }, to: { x: 0, y: 0 } }
    };
    var emblems = {
        bronze: (function () {
            var image = new Image();
            image.src = "../../assets/emblems/emblem_bronze.png";
            return image;
        })(),
        silver: (function () {
            var image = new Image();
            image.src = "../../assets/emblems/emblem_silver.png";
            return image;
        })(),
        platinum: (function () {
            var image = new Image();
            image.src = "../../assets/emblems/emblem_platinum.png";
            return image;
        })(),
        gold: (function () {
            var image = new Image();
            image.src = "../../assets/emblems/emblem_gold.png";
            return image;
        })(),
        diamond: (function () {
            var image = new Image();
            image.src = "../../assets/emblems/emblem_diamond.png";
            return image;
        })(),
        painite: (function () {
            var image = new Image();
            image.src = "../../assets/emblems/emblem_painite.png";
            return image;
        })(),
        guest: (function () {
            var image = new Image();
            image.src = "../../assets/emblems/emblem_guest-or-unknown.png";
            return image;
        })(),
        admin: (function () {
            var image = new Image();
            image.src = "../../assets/emblems/emblem_admin.png";
            return image;
        })(),
    };
    var details = {
        mode: "FFA",
        id: "ffa",
        singleplayer: false
    };
    var ping = 0;
    var windowBlur = false;
    canvas.width = window.innerWidth - 30;
    canvas.height = window.innerHeight - 30;
    var BlobType;
    (function (BlobType) {
        BlobType["Blobowo"] = "../assets/blobowo.png";
        BlobType["Blobevil"] = "../assets/blobevil.png";
        BlobType["Blobeyes"] = "../assets/blobeyes.png";
        BlobType["Blobkittenknife"] = "../assets/BlobKittenKnife.png";
        BlobType["Blobpeek"] = "../assets/blobpeek.png";
        BlobType["Blobnom"] = "../assets/blobnom.png";
    })(BlobType || (BlobType = {}));
    var ItemType;
    (function (ItemType) {
        ItemType[ItemType["Health"] = 0] = "Health";
    })(ItemType || (ItemType = {}));
    var OPCODE;
    (function (OPCODE) {
        OPCODE[OPCODE["HELLO"] = 1] = "HELLO";
        OPCODE[OPCODE["HEARTBEAT"] = 2] = "HEARTBEAT";
        OPCODE[OPCODE["EVENT"] = 3] = "EVENT";
        OPCODE[OPCODE["CLOSE"] = 4] = "CLOSE";
    })(OPCODE || (OPCODE = {}));
    var EventType;
    (function (EventType) {
        EventType["COORDINATE_CHANGE"] = "coordinateChange";
        EventType["HEARTBEAT"] = "heartbeat";
        EventType["KICK"] = "kick";
        EventType["KICK_PLAYER"] = "kickPlayer";
        EventType["NOM_KEY"] = "nomKey";
        EventType["SP_NOM_KEY"] = "singlePlayerNomKey";
        EventType["DIRECTION_CHANGE_C"] = "directionChange";
        EventType["PLAYER_NOMMED"] = "playerNommed";
    })(EventType || (EventType = {}));
    var Direction;
    (function (Direction) {
        Direction[Direction["UP"] = 0] = "UP";
        Direction[Direction["DOWN"] = 2] = "DOWN";
        Direction[Direction["LEFT"] = 3] = "LEFT";
        Direction[Direction["RIGHT"] = 1] = "RIGHT";
    })(Direction || (Direction = {}));
    var WallObject = (function () {
        function WallObject(x, y) {
            if (x === void 0) { x = randomNumber(25, canvas.width - 25); }
            if (y === void 0) { y = randomNumber(25, canvas.height - 25); }
            this.x = x;
            this.y = y;
            this.width = 30;
            this.height = 30;
            this.img = new Image();
            this.url = "../assets/brickwall.png";
            this.type = 0;
        }
        WallObject.prototype.setImage = function (img) {
            var _this = this;
            if (img === void 0) { img = this.url; }
            return new Promise(function (a) {
                _this.img.src = img;
                _this.img.onload = a;
            });
        };
        WallObject.prototype.display = function () {
            var _this = this;
            return new Promise(function (a, b) {
                if (!_this.img.complete)
                    b("Image not loaded");
                if (!ctx)
                    return;
                ctx.drawImage(_this.img, _this.x, _this.y, _this.width, _this.height);
            });
        };
        return WallObject;
    }());
    var NoNomArea = (function () {
        function NoNomArea(startsAt, endsAt) {
            this.startsAt = startsAt;
            this.endsAt = endsAt;
        }
        NoNomArea.prototype.display = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!ctx)
                        throw new Error("ctx is null");
                    ctx.fillStyle = "#aaddb5";
                    ctx.fillRect(this.startsAt.x, this.startsAt.y, this.endsAt.x, this.endsAt.y);
                    return [2];
                });
            });
        };
        NoNomArea.display = function (startsAt, endsAt) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!ctx)
                        throw new Error("ctx is null");
                    ctx.fillStyle = "#aaddb5";
                    ctx.fillRect(startsAt.x, startsAt.y, endsAt.x, endsAt.y);
                    return [2];
                });
            });
        };
        return NoNomArea;
    }());
    var BlobObject = (function () {
        function BlobObject(br, owner, x, y, blob) {
            if (x === void 0) { x = window.innerWidth / 2; }
            if (y === void 0) { y = window.innerHeight / 2; }
            if (blob === void 0) { blob = BlobType.Blobowo; }
            this.blob = blob;
            this.guest = false;
            this.owner = owner;
            this.br = br;
            this.img = new Image();
            this.direction = 0;
            this.lastnom = 0;
            this.directionChangedAt = Date.now();
            this.directionChangeCoordinates = { x: x, y: y };
            this.health = 100;
            this.x = x;
            this.y = y;
            this.role = 0;
        }
        Object.defineProperty(BlobObject.prototype, "inProtectedArea", {
            get: function () {
                var inArea = false;
                var pos = { x: this.x, y: this.y };
                if (!objects.noNomAreas)
                    return false;
                for (var i = 0; i < objects.noNomAreas.length; ++i) {
                    if (objects.noNomAreas[i].startsAt.x <= pos.x
                        && objects.noNomAreas[i].startsAt.x + (Math.abs(objects.noNomAreas[i].endsAt.x - objects.noNomAreas[i].startsAt.x)) > pos.x
                        && objects.noNomAreas[i].startsAt.y <= pos.y
                        && objects.noNomAreas[i].startsAt.y + (Math.abs(objects.noNomAreas[i].endsAt.y - objects.noNomAreas[i].startsAt.y)) > pos.y)
                        inArea = true;
                }
                return inArea;
            },
            enumerable: true,
            configurable: true
        });
        BlobObject.prototype.setBlob = function (image) {
            var _this = this;
            if (image === void 0) { image = BlobType.Blobowo; }
            return new Promise(function (a) {
                _this.img.src = image;
                _this.img.onload = a;
            });
        };
        BlobObject.prototype.display = function (displayUser, displayBr, width, height) {
            var _this = this;
            if (displayUser === void 0) { displayUser = false; }
            if (displayBr === void 0) { displayBr = false; }
            if (width === void 0) { width = 30; }
            if (height === void 0) { height = 30; }
            return new Promise(function (a, b) {
                if (!_this.img.complete)
                    b("Image not loaded");
                if (!ctx)
                    return b();
                ctx.beginPath();
                var canvasX = canvas.width / 2 - width, canvasY = canvas.height / 2 - height;
                var tier = getTier(_this.br || 0);
                if (!tier || !tier.tier)
                    return;
                if (_this.owner === ownBlob.owner && _this.owner) {
                    ctx.fillStyle = "#" + tier.colorCode;
                    ctx.font = 15 * scale + "px Dosis";
                    ctx.drawImage(_this.img, canvasX, canvasY, width * scale, height * scale);
                    ctx.font = "16px Raleway";
                    ctx.fillText(_this.owner, canvasX - _this.owner.length, canvasY - 27.5);
                    ctx.font = "13px Raleway";
                    ctx.fillText(_this.br + " BR", canvasX, canvasY - 10);
                    ctx.fillStyle = "white";
                    if (emblems[tier.tier].complete) {
                        ctx.drawImage(emblems[tier.tier], canvasX - (15 + 15 * scale), canvasY - (10 + 15 * scale), 20 * scale, 20 * scale);
                    }
                    ctx.strokeStyle = "lightgreen";
                    ctx.moveTo(canvasX - (35 * scale), canvasY - 3);
                    ctx.lineTo(canvasX - (35 / scale) + (100 * (_this.health / 100)), canvasY - 3);
                    ctx.closePath();
                    ctx.stroke();
                    if (_this.role === 1) {
                        ctx.drawImage(objects.images.crown, canvasX - (30 + 30 * scale), canvasY - (10 + 15 * scale), 20 * scale, 20 * scale);
                    }
                }
                else if (_this.owner) {
                    var blobCanvasX = 0, blobCanvasY = 0;
                    if (ownBlob.x >= _this.x) {
                        blobCanvasX = (canvas.width / 2) - (ownBlob.x - _this.x);
                    }
                    else if (ownBlob.x < _this.x) {
                        blobCanvasX = (canvas.width / 2) + (_this.x - ownBlob.x);
                    }
                    if (ownBlob.y >= _this.y) {
                        blobCanvasY = (canvas.height / 2) - (ownBlob.y - _this.y);
                    }
                    else if (ownBlob.y < _this.y) {
                        blobCanvasY = (canvas.height / 2) + (_this.y - ownBlob.y);
                    }
                    blobCanvasY -= height;
                    blobCanvasX -= width;
                    if (emblems[tier.tier].complete) {
                        ctx.drawImage(emblems[tier.tier], blobCanvasX - (15 + 15 * scale), blobCanvasY - (10 + 15 * scale), 20 * scale, 20 * scale);
                    }
                    ctx.fillStyle = "#" + tier.colorCode;
                    ctx.drawImage(_this.img, blobCanvasX, blobCanvasY, width * scale, height * scale);
                    if (displayUser) {
                        ctx.font = "16px Raleway";
                        ctx.fillText(_this.owner, blobCanvasX - _this.owner.length, (blobCanvasY) - 27.5);
                        ctx.font = "13px Raleway";
                        ctx.fillText(_this.br + " BR", blobCanvasX, blobCanvasY - 10);
                        ctx.fillStyle = "white";
                    }
                    ctx.strokeStyle = "lightgreen";
                    ctx.moveTo(blobCanvasX - (15 + 15 * scale), blobCanvasY - 3);
                    ctx.lineTo(blobCanvasX - (15 + 15 * scale) + (100 * (_this.health / 100)), blobCanvasY - 3);
                    ctx.closePath();
                    ctx.stroke();
                    if (_this.role === 1) {
                        ctx.drawImage(objects.images.crown, blobCanvasX - (30 + 30 * scale), blobCanvasY - (10 + 15 * scale), 20 * scale, 20 * scale);
                    }
                }
            });
        };
        BlobObject.display = function (blobArray, displayUser, displayBr, width, height) {
            if (displayUser === void 0) { displayUser = false; }
            if (displayBr === void 0) { displayBr = false; }
            if (width === void 0) { width = 30; }
            if (height === void 0) { height = 30; }
            for (var _i = 0, blobArray_1 = blobArray; _i < blobArray_1.length; _i++) {
                var blob = blobArray_1[_i];
                blob.display(displayUser, displayBr, width, height).catch(console.error);
            }
        };
        BlobObject.find = function (x, y, excludeSelf) {
            if (excludeSelf === void 0) { excludeSelf = false; }
            var obj;
            for (var i = 0; i < blobs.length; ++i) {
                if (x < (blobs[i].x + 30) && x > (blobs[i].x - 30)) {
                    if (y < (blobs[i].y + 30) && y > (blobs[i].y - 30) && blobs[i].owner !== ownBlob.owner) {
                        if (excludeSelf && blobs[i].owner === ownBlob.owner)
                            continue;
                        obj = blobs[i];
                        break;
                    }
                }
            }
            return obj;
        };
        return BlobObject;
    }());
    var Item = (function () {
        function Item(x, y, id) {
            if (x === void 0) { x = randomNumber(0, mapSize.width); }
            if (y === void 0) { y = randomNumber(0, mapSize.height); }
            if (id === void 0) { id = ItemType.Health; }
            this.x = x;
            this.y = y;
            this.id = id;
        }
        Item.prototype.display = function () {
            if (!ctx)
                return;
            var canvasPosX = 0, canvasPosY = 0;
            if (ownBlob.x >= this.x) {
                canvasPosX = (canvas.width / 2) - (ownBlob.x - this.x);
            }
            else if (ownBlob.x < this.x) {
                canvasPosX = (canvas.width / 2) + (this.x - ownBlob.x);
            }
            if (ownBlob.y >= this.y) {
                canvasPosY = (canvas.height / 2) - (ownBlob.y - this.y);
            }
            else if (ownBlob.y < this.y) {
                canvasPosY = (canvas.height / 2) + (this.y - ownBlob.y);
            }
            canvasPosY -= 45;
            canvasPosX -= 45;
            ctx.drawImage(objects.images.heart, canvasPosX, canvasPosY, 20, 20);
        };
        Object.defineProperty(Item.prototype, "state", {
            get: function () {
                return this.x < (ownBlob.x + 10) && this.x > (ownBlob.x - 10) && this.y < (ownBlob.y + 10) && this.y > (ownBlob.y - 10);
            },
            enumerable: true,
            configurable: true
        });
        return Item;
    }());
    function animationFrame() {
        if (windowBlur) {
            return window.requestAnimationFrame(animationFrame);
        }
        if (Date.now() - lastIteration > 200) {
            ownBlob.directionChangedAt = Date.now();
            ownBlob.directionChangeCoordinates.x = ownBlob.x;
            ownBlob.directionChangeCoordinates.y = ownBlob.y;
        }
        var fpsMeterElement = document.getElementById("fps-meter");
        if (Date.now() - lastIteration > 100 && fpsMeterElement)
            fpsMeterElement.innerHTML = (10000 / (Date.now() - lastIteration)).toFixed(1) + " FPS";
        lastIteration = Date.now();
        if (!ownBlob || !ownBlob.ready)
            return window.requestAnimationFrame(animationFrame);
        if (Date.now() - lastTick > 2500) {
            displayLeaderboard();
            var timestampBefore_1 = Date.now();
            request("/api/ping", "GET").then(function (res) {
                var request = JSON.parse(res.responseText);
                var diff = ping = (request.arrived - timestampBefore_1);
                var latencyElement = document.getElementById("latency");
                if (!latencyElement)
                    return;
                latencyElement.innerHTML = "\u2022 Ping: <span style=\"color: #" + (diff < 10 ? '00ff00' : (diff < 30 ? 'ccff99' : (diff < 50 ? 'ffff99' : (diff < 100 ? 'ff9966' : 'ff0000')))) + "\">" + diff + "ms</span>";
            });
            lastTick = Date.now();
        }
        var movable = true;
        if (ownBlob.x < 0) {
            ownBlob.direction = 4;
            ownBlob.x = 0;
            movable = false;
        }
        else if (ownBlob.y < 0) {
            ownBlob.direction = 4;
            ownBlob.y = 0;
            movable = false;
        }
        else if (ownBlob.y > mapSize.height) {
            ownBlob.direction = 4;
            ownBlob.y = mapSize.height;
            movable = false;
        }
        else if (ownBlob.x > mapSize.width) {
            ownBlob.direction = 4;
            ownBlob.x = mapSize.width;
            movable = false;
        }
        if (ownBlob.direction === 0 && movable)
            ownBlob.y = ownBlob.directionChangeCoordinates.y - (1.025 * ((Date.now() - ownBlob.directionChangedAt) / 10));
        else if (ownBlob.direction === 1 && movable)
            ownBlob.x = ownBlob.directionChangeCoordinates.x + (1.025 * ((Date.now() - ownBlob.directionChangedAt) / 10));
        else if (ownBlob.direction === 2 && movable)
            ownBlob.y = ownBlob.directionChangeCoordinates.y + (1.025 * ((Date.now() - ownBlob.directionChangedAt) / 10));
        else if (ownBlob.direction === 3 && movable)
            ownBlob.x = ownBlob.directionChangeCoordinates.x - (1.025 * ((Date.now() - ownBlob.directionChangedAt) / 10));
        if (details.singleplayer === false && movable)
            ws.send(JSON.stringify({
                op: OPCODE.EVENT,
                t: EventType.COORDINATE_CHANGE,
                d: {
                    x: ownBlob.x,
                    y: ownBlob.y,
                    room: details.id
                }
            }));
        clearCanvas(ctx);
        drawBorder(ctx);
        displayCooldown(ctx);
        displayPlayerStats(ctx);
        displayWalls(ctx);
        displayNoNomAreas(ctx);
        displayHP(ctx);
        displayMinimap(ctx);
        BlobObject.display(blobs, true, true);
    }
    var lastIteration = Date.now();
    window.requestAnimationFrame(animationFrame);
    ws.addEventListener("message", function (_a) {
        var data = _a.data;
        var _b = JSON.parse(data), op = _b.op, eventType = _b.t, eventData = _b.d;
        if (op === OPCODE.EVENT) {
            if (eventType === EventType.HEARTBEAT) {
                if (eventData.user.role === -1 && !/[?&]guest=true/.test(window.location.search))
                    return document.location.href = "/login/";
                ownBlob.owner = eventData.user.username;
                ownBlob.blob = eventData.user.blob;
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates.x = ownBlob.x = eventData.user.x;
                ownBlob.directionChangeCoordinates.y = ownBlob.y = eventData.user.y;
                ownBlob.br = eventData.user.br;
                ownBlob.ready = true;
                ownBlob.role = eventData.user.role;
                ownBlob.setBlob("../assets/" + eventData.user.blob + ".png").catch(console.log);
                blobs.push(ownBlob);
                if (details.singleplayer)
                    eventData.users = [];
                var _loop_2 = function (i) {
                    var currentBlob = eventData.users[i];
                    if (currentBlob.owner === ownBlob.owner ||
                        blobs.some(function (v) { return v.owner === currentBlob.owner; }))
                        return "continue";
                    var newBlob = new BlobObject(currentBlob.br, currentBlob.owner);
                    newBlob.directionChangeCoordinates = {
                        x: currentBlob.x,
                        y: currentBlob.y
                    };
                    newBlob.role = currentBlob.role;
                    newBlob.direction = currentBlob.direction;
                    newBlob.directionChangedAt = currentBlob.directionChangedAt;
                    newBlob.setBlob("../assets/" + currentBlob.blob + ".png")
                        .then(function () { return newBlob.display(); });
                    blobs.push(newBlob);
                };
                for (var i = 0; i < eventData.users.length; ++i) {
                    _loop_2(i);
                }
                setInterval(function () {
                    ws.send(JSON.stringify({
                        op: OPCODE.HEARTBEAT,
                        d: {
                            room: details.id
                        }
                    }));
                }, eventData.interval);
            }
            else if (eventType === EventType.COORDINATE_CHANGE) {
                if (!ownBlob || !ownBlob.ready)
                    return;
                var _loop_3 = function (i) {
                    var currentBlob = eventData.players[i];
                    var target = blobs.find(function (v) { return v.owner === currentBlob.owner; });
                    if (!target) {
                        var newBlob_1 = new BlobObject(currentBlob.br, currentBlob.owner, currentBlob.x, currentBlob.y);
                        newBlob_1.direction = currentBlob.direction;
                        newBlob_1.directionChangedAt = currentBlob.directionChangedAt;
                        newBlob_1.directionChangeCoordinates = currentBlob.directionChangeCoordinates;
                        newBlob_1.health = currentBlob.health;
                        newBlob_1
                            .setBlob("../assets/" + currentBlob.blob + ".png")
                            .then(function () { return newBlob_1.display(true, true); });
                        if (blobs.some(function (v) { return v.owner === currentBlob.owner; }))
                            return { value: void 0 };
                        blobs.push(newBlob_1);
                    }
                    else {
                        if (currentBlob.owner !== ownBlob.owner) {
                            target.direction = currentBlob.direction;
                            target.directionChangedAt = currentBlob.directionChangedAt;
                            target.directionChangeCoordinates = currentBlob.directionChangeCoordinates;
                            target.x = currentBlob.x;
                            target.y = currentBlob.y;
                        }
                        target.health = currentBlob.health;
                    }
                };
                for (var i = 0; i < eventData.players.length; ++i) {
                    var state_1 = _loop_3(i);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
                var _loop_4 = function (i) {
                    var blob = eventData.players.findIndex(function (v) { return v.owner === blobs[i].owner; });
                    if (blob === -1) {
                        blobs.splice(blobs.findIndex(function (v) { return v.owner === blobs[i].owner; }), 1);
                    }
                };
                for (var i = 0; i < blobs.length; ++i) {
                    _loop_4(i);
                }
            }
            else if (eventType === EventType.KICK) {
                alert("You have been kicked.\nReason: " + (eventData.message || "-"));
            }
        }
    });
    var htmlButtonIDs = [
        "btnup",
        "btndown",
        "btnleft",
        "btnright",
        "nom-btn-mobile"
    ];
    var _loop_1 = function (buttonID) {
        var htmlElement = document.getElementById(buttonID);
        if (!htmlElement)
            return "continue";
        htmlElement.addEventListener("click", function () {
            if (buttonID === htmlButtonIDs[0]) {
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = Direction.UP;
                if (!details.singleplayer)
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.DIRECTION_CHANGE_C,
                        d: {
                            direction: ownBlob.direction,
                            directionChangedAt: ownBlob.directionChangedAt,
                            directionChangeCoordinates: ownBlob.directionChangeCoordinates,
                            room: details.id
                        }
                    }));
            }
            else if (buttonID === htmlButtonIDs[1]) {
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = Direction.DOWN;
                if (!details.singleplayer)
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.DIRECTION_CHANGE_C,
                        d: {
                            direction: ownBlob.direction,
                            directionChangedAt: ownBlob.directionChangedAt,
                            directionChangeCoordinates: ownBlob.directionChangeCoordinates,
                            room: details.id
                        }
                    }));
            }
            else if (buttonID === htmlButtonIDs[2]) {
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = Direction.LEFT;
                if (!details.singleplayer)
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.DIRECTION_CHANGE_C,
                        d: {
                            direction: ownBlob.direction,
                            directionChangedAt: ownBlob.directionChangedAt,
                            directionChangeCoordinates: ownBlob.directionChangeCoordinates,
                            room: details.id
                        }
                    }));
            }
            else if (buttonID === htmlButtonIDs[3]) {
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = Direction.RIGHT;
                if (!details.singleplayer)
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.DIRECTION_CHANGE_C,
                        d: {
                            direction: ownBlob.direction,
                            directionChangedAt: ownBlob.directionChangedAt,
                            directionChangeCoordinates: ownBlob.directionChangeCoordinates,
                            room: details.id
                        }
                    }));
            }
        });
    };
    for (var _i = 0, htmlButtonIDs_1 = htmlButtonIDs; _i < htmlButtonIDs_1.length; _i++) {
        var buttonID = htmlButtonIDs_1[_i];
        _loop_1(buttonID);
    }
    var kickMenu = document.getElementById("kick-menu");
    {
        var kickElement = document.getElementById("kickbtn");
        if (kickElement) {
            kickElement.addEventListener("click", function () {
                if (ownBlob.role !== 1)
                    return;
                var targetUserElement = document.getElementById("target-name"), targetUserReason = document.getElementById("kick-reason");
                if (!targetUserElement || !targetUserReason)
                    return;
                ws.send(JSON.stringify({
                    op: OPCODE.EVENT,
                    t: EventType.KICK_PLAYER,
                    d: {
                        user: targetUserElement.value,
                        reason: targetUserReason.value,
                        room: details.id
                    }
                }));
            });
        }
        var closeMenu = document.getElementById("closemenu");
        if (closeMenu) {
            closeMenu.addEventListener("click", function () {
                if (!kickMenu)
                    return;
                kickMenu.style.display = "none";
            });
        }
    }
    window.addEventListener("resize", function () {
        canvas.width = window.innerWidth - 30;
        canvas.height = window.innerHeight - 30;
    });
    document.addEventListener("keydown", function (eventd) {
        switch (eventd.key) {
            case "Enter":
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 4;
                if (!details.singleplayer)
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.DIRECTION_CHANGE_C,
                        d: {
                            direction: ownBlob.direction,
                            directionChangedAt: ownBlob.directionChangedAt,
                            directionChangeCoordinates: ownBlob.directionChangeCoordinates,
                            room: details.id
                        }
                    }));
                break;
            case "w":
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 0;
                if (!details.singleplayer)
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.DIRECTION_CHANGE_C,
                        d: {
                            direction: ownBlob.direction,
                            directionChangedAt: ownBlob.directionChangedAt,
                            directionChangeCoordinates: ownBlob.directionChangeCoordinates,
                            room: details.id
                        }
                    }));
                break;
            case "d":
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 1;
                if (!details.singleplayer)
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.DIRECTION_CHANGE_C,
                        d: {
                            direction: ownBlob.direction,
                            directionChangedAt: ownBlob.directionChangedAt,
                            directionChangeCoordinates: ownBlob.directionChangeCoordinates,
                            room: details.id
                        }
                    }));
                break;
            case "s":
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 2;
                if (!details.singleplayer)
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.DIRECTION_CHANGE_C,
                        d: {
                            direction: ownBlob.direction,
                            directionChangedAt: ownBlob.directionChangedAt,
                            directionChangeCoordinates: ownBlob.directionChangeCoordinates,
                            room: details.id
                        }
                    }));
                break;
            case "a":
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 3;
                if (!details.singleplayer)
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.DIRECTION_CHANGE_C,
                        d: {
                            direction: ownBlob.direction,
                            directionChangedAt: ownBlob.directionChangedAt,
                            directionChangeCoordinates: ownBlob.directionChangeCoordinates,
                            room: details.id
                        }
                    }));
                break;
            case "n":
                if (Date.now() - ownBlob.lastnom <= 1500)
                    return;
                ownBlob.lastnom = Date.now();
                if (!details.singleplayer)
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.NOM_KEY,
                        d: {
                            room: details.id
                        },
                    }));
                else {
                    var target = BlobObject.find(ownBlob.x, ownBlob.y, true);
                    if (!target)
                        return;
                    nom(ownBlob, target);
                }
                break;
            case "k":
                if (ownBlob.role === 1 && kickMenu)
                    kickMenu.style.display = "block";
                break;
        }
    });
    window.addEventListener("blur", function () { return windowBlur = true; });
    window.addEventListener("focus", function () { return windowBlur = false; });
    var mouseScrollEvent = function () {
        var eventd = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            eventd[_i] = arguments[_i];
        }
        var event = eventd[0];
        var deltaValue = 0;
        if (event.wheelDelta) {
            deltaValue = event.wheelDelta / 120;
        }
        else if (event.detail) {
            deltaValue = -event.detail / 3;
        }
        if (!deltaValue)
            return;
        if (deltaValue < 0 && scale > .5)
            scale -= .1;
        else if (scale < 7)
            scale += .1;
    };
    window.addEventListener("DOMMouseScroll", mouseScrollEvent);
    window.onmousewheel = mouseScrollEvent;
    function displayMinimap(context) {
        if (context === void 0) { context = ctx; }
        if (!context)
            return;
        context.beginPath();
        context.strokeStyle = "white";
        context.rect(canvas.width - 225, canvas.height - 75, 75, 75);
        context.stroke();
        context.fillStyle = "lightgreen";
        context.fillRect(canvas.width - 225 + (65 / (mapSize.width / ownBlob.x)), canvas.height - 75 + (65 / (mapSize.height / ownBlob.y)), 10, 10);
        for (var i = 0; i < blobs.length; ++i) {
            if (blobs[i].owner != ownBlob.owner) {
                context.fillStyle = "red";
                context.fillRect(canvas.width - 225 + (65 / (mapSize.width / blobs[i].x)), canvas.height - 75 + (65 / (mapSize.height / blobs[i].y)), 10, 10);
            }
        }
    }
    function displayHP(context) {
        if (context === void 0) { context = ctx; }
        if (!context)
            return;
        context.font = "50px Raleway";
        if (ownBlob.health >= 80)
            context.fillStyle = "#2ecc71";
        else if (ownBlob.health >= 50)
            context.fillStyle = "#f39c12";
        else if (ownBlob.health >= 30)
            context.fillStyle = "#e67e22";
        else if (ownBlob.health >= 10)
            context.fillStyle = "#e74c3c";
        else
            context.fillStyle = "#c0392b";
        context.fillText(ownBlob.health.toString(), canvas.width - 120, canvas.height - 20);
        context.font = "20px Raleway";
        context.fillText("HP", canvas.width - 35, canvas.height - 20);
        context.fillStyle = "white";
        window.requestAnimationFrame(animationFrame);
    }
    function displayNoNomAreas(context) {
        if (context === void 0) { context = ctx; }
        if (!objects.noNomAreas)
            return;
        for (var i = 0; i < objects.noNomAreas.length; ++i) {
            var canvasPosX = 0, canvasPosY = 0;
            if (ownBlob.x >= objects.noNomAreas[i].startsAt.x) {
                canvasPosX = (canvas.width / 2) - (ownBlob.x - objects.noNomAreas[i].startsAt.x);
            }
            else if (ownBlob.x < objects.noNomAreas[i].startsAt.x) {
                canvasPosX = (canvas.width / 2) + (objects.noNomAreas[i].startsAt.x - ownBlob.x);
            }
            if (ownBlob.y >= objects.noNomAreas[i].startsAt.y) {
                canvasPosY = (canvas.height / 2) - (ownBlob.y - objects.noNomAreas[i].startsAt.y);
            }
            else if (ownBlob.y < objects.noNomAreas[i].startsAt.y) {
                canvasPosY = (canvas.height / 2) + (objects.noNomAreas[i].startsAt.y - ownBlob.y);
            }
            canvasPosX -= 35;
            canvasPosY -= 35;
            NoNomArea
                .display({ x: canvasPosX, y: canvasPosY }, { x: Math.abs(objects.noNomAreas[i].startsAt.x - objects.noNomAreas[i].endsAt.x), y: Math.abs(objects.noNomAreas[i].startsAt.y - objects.noNomAreas[i].endsAt.y) })
                .catch(console.error);
        }
    }
    function clearCanvas(context) {
        if (context === void 0) { context = ctx; }
        if (!context)
            return;
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
    function displayLeaderboard() {
        var placementColors = ["#e74c3c", "#e67e22", "#9b59b6", "#3498db", "#2980b9", "#2ecc71", "#f1c40f", "#d35400", "#8e44ad", "#16a085"];
        var leaderboardElement = document.getElementById("leaderboard");
        if (!leaderboardElement)
            return;
        leaderboardElement.innerHTML = "<h3>Leaderboard</h3>";
        var sortedblobs = blobs.slice(0, 10).sort(function (a, b) { return b.br - a.br; });
        if (!sortedblobs)
            return;
        for (var i = 0; i < sortedblobs.length; ++i) {
            var leaderboardEntry = document.createElement("div");
            var usernameEntry = document.createElement("span");
            usernameEntry.style.color = placementColors[i];
            var brLabel = document.createElement("span");
            brLabel.style.color = placementColors[i];
            var linebreak = document.createElement("br");
            leaderboardEntry.className = "leaderboard-entry";
            usernameEntry.className = "user-entry";
            if (typeof sortedblobs[i].owner === "undefined")
                return;
            usernameEntry.innerHTML = (i + 1) + ". " + sortedblobs[i].owner;
            brLabel.className = "user-br";
            brLabel.innerHTML = sortedblobs[i].br + " BR";
            leaderboardElement.appendChild(leaderboardEntry);
            leaderboardElement.appendChild(usernameEntry);
            leaderboardElement.appendChild(brLabel);
            leaderboardElement.appendChild(linebreak);
        }
    }
    function displayWalls(context) {
        if (context === void 0) { context = ctx; }
        if (!context)
            return;
        for (var i = 0; i < objects.walls.length; ++i) {
            var canvasPosX = 0, canvasPosY = 0;
            if (ownBlob.x >= objects.walls[i].x) {
                canvasPosX = (canvas.width / 2) - (ownBlob.x - objects.walls[i].x);
            }
            else if (ownBlob.x < objects.walls[i].x) {
                canvasPosX = (canvas.width / 2) + (objects.walls[i].x - ownBlob.x);
            }
            if (ownBlob.y >= objects.walls[i].y) {
                canvasPosY = (canvas.height / 2) - (ownBlob.y - objects.walls[i].y);
            }
            else if (ownBlob.y < objects.walls[i].y) {
                canvasPosY = (canvas.height / 2) + (objects.walls[i].y - ownBlob.y);
            }
            canvasPosY -= 45;
            canvasPosX -= 45;
            context.drawImage(objects.images.brickwall, canvasPosX, canvasPosY, 45, 45);
        }
    }
    function displayCooldown(context) {
        if (context === void 0) { context = ctx; }
        var nomCooldownElement = document.getElementById("nom-cooldown");
        if (!nomCooldownElement)
            return;
        if (document.getElementById("cooldown-timer")) {
            nomCooldownElement.removeChild(document.getElementById("cooldown-timer"));
        }
        var timerElement = document.createElement("span");
        var nomReady = Date.now() - ownBlob.lastnom > 1500;
        timerElement.id = "cooldown-timer";
        timerElement.innerHTML = !nomReady ? ((1500 - (Date.now() - ownBlob.lastnom)) / 1000).toFixed(1) + "s" : "Ready";
        nomCooldownElement.appendChild(timerElement);
    }
    function displayPlayerStats(context) {
        if (context === void 0) { context = ctx; }
        if (!context)
            return;
        context.font = "15px Dosis";
        context.fillText("X: " + Math.floor(ownBlob.x) + " | Y: " + Math.floor(ownBlob.y), canvas.width - 80, canvas.height);
    }
    function drawBorder(context) {
        if (context === void 0) { context = ctx; }
        if (!context)
            return;
        context.beginPath();
        context.strokeStyle = "white";
        var diffXPos = ownBlob.x + (canvas.width / 2);
        var diffXNeg = ownBlob.x - (canvas.width / 2);
        var diffYPos = ownBlob.y + (canvas.height / 2);
        var diffYNeg = ownBlob.y - (canvas.height / 2);
        if (diffXPos > mapSize.width) {
            context.beginPath();
            context.moveTo(border.right.from.x = (canvas.width - (diffXPos - mapSize.width)), border.right.from.y = (diffYNeg < 0 ? -(diffYNeg + 35) : 0));
            context.lineTo(border.right.to.x = (canvas.width - (diffXPos - mapSize.width)), border.right.to.y = (diffYPos > mapSize.height ? canvas.height - (diffYPos - mapSize.height) : canvas.height));
            context.closePath();
            context.stroke();
        }
        else if (border.right.from.x !== 0 || border.right.from.y !== 0 || border.right.to.x !== 0 || border.right.to.y !== 0) {
            border.right.from.x = border.right.from.y = border.right.to.x = border.right.to.y = 0;
        }
        if (diffXNeg < 0) {
            context.beginPath();
            context.moveTo(border.left.from.x = (-(diffXNeg + 35)), border.left.from.y = (diffYNeg < 0 ? -(diffYNeg + 35) : 0));
            context.lineTo(border.left.to.x = (-(diffXNeg + 35)), border.left.to.y = (diffYPos > mapSize.height ? canvas.height - (diffYPos - mapSize.height) : canvas.height));
            context.closePath();
            context.stroke();
        }
        else if (border.left.from.x !== 0 || border.left.from.y !== 0 || border.left.to.x !== 0 || border.left.to.y !== 0) {
            border.left.from.x = border.left.from.y = border.left.to.x = border.left.to.y = 0;
        }
        if (diffYPos > mapSize.height) {
            context.beginPath();
            context.moveTo(border.bottom.from.x = (diffXNeg < 0 ? -(diffXNeg + 35) : 0), border.bottom.from.y = (canvas.height - (diffYPos - mapSize.height)));
            context.lineTo(border.bottom.to.x = (diffXPos > mapSize.width ? canvas.width - (diffXPos - mapSize.width) : canvas.width), border.bottom.to.y = (canvas.height - (diffYPos - mapSize.height)));
            context.closePath();
            context.stroke();
        }
        else if (border.bottom.from.x !== 0 || border.bottom.from.y !== 0 || border.bottom.to.x !== 0 || border.bottom.to.y !== 0) {
            border.bottom.from.x = border.bottom.from.y = border.bottom.to.x = border.bottom.to.y = 0;
        }
        if (diffYNeg < 0) {
            context.beginPath();
            context.moveTo(border.top.from.x = (diffXNeg < 0 ? -(diffXNeg + 35) : 0), border.top.from.y = (-(diffYNeg + 35)));
            context.lineTo(border.top.to.x = (diffXPos > mapSize.width ? canvas.width - (diffXPos - mapSize.width) : canvas.width), border.top.to.y = (-(diffYNeg + 35)));
            context.closePath();
            context.stroke();
        }
        else if (border.top.from.x !== 0 || border.top.from.y !== 0 || border.top.to.x !== 0 || border.top.to.y !== 0) {
            border.top.from.x = border.top.from.y = border.top.to.x = border.top.to.y = 0;
        }
    }
    function getTier(br) {
        var result = {};
        if (br >= 0 && br < 1500) {
            result.tier = "bronze";
            result.colorCode = "b57156";
            result.emblemFile = "emblem_bronze.png";
        }
        else if (br >= 1500 && br < 3000) {
            result.tier = "silver";
            result.colorCode = "dbdbdb";
            result.emblemFile = "emblem_silver.png";
        }
        else if (br >= 3000 && br < 5000) {
            result.tier = "platinum";
            result.colorCode = "E5E4E2";
            result.emblemFile = "emblem_platinum.png";
        }
        else if (br >= 5000 && br < 8000) {
            result.tier = "gold";
            result.colorCode = "D7AF00";
            result.emblemFile = "emblem_gold.png";
        }
        else if (br >= 8000 && br < 9500) {
            result.tier = "diamond";
            result.colorCode = "16f7ef";
            result.emblemFile = "emblem_diamond.png";
        }
        else if (br >= 9500 && br < 10000) {
            result.tier = "painite";
            result.colorCode = "16f77f";
            result.emblemFile = "emblem_painite.png";
        }
        return result;
    }
    function nom(attackBlob, target) {
        if (attackBlob.x < (target.x + 30) && attackBlob.x > (target.x - 30)) {
            if (attackBlob.y < (target.y + 30) && attackBlob.y > (target.y - 30)) {
                target.health -= randomNumber(30, 40);
                if (target.health <= 0) {
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.SP_NOM_KEY,
                        d: {
                            attackBlob: attackBlob,
                            target: target,
                            room: details.id
                        }
                    }));
                    target.health = 100;
                }
            }
        }
    }
    function sendOnReady(wsc, data) {
        if (wsc.readyState === WebSocket.OPEN) {
            wsc.send(data);
        }
        else if (wsc.readyState === WebSocket.CONNECTING) {
            wsc.onopen = function () { return wsc.send(data); };
        }
    }
    var ownBlob = new BlobObject(1000, "");
    ownBlob.ready = false;
    ownBlob
        .setBlob()
        .then(function () {
        ownBlob.display(true, true).catch(console.error);
    });
    if (/[?&]guest=true/.test(window.location.search)) {
        ownBlob.guest = true;
    }
    console.log("%c You know JavaScript / TypeScript? Contribute to blobs.io! https://github.com/blobs-io/blobs.io", "color: green");
    (function () { return __awaiter(_this, void 0, void 0, function () {
        var bar, lastTick, itr, val, interval;
        return __generator(this, function (_a) {
            bar = document.getElementById("bar-inside");
            if (!bar)
                return [2];
            request("/api/ffa/players", "GET", {}).then(function (res) {
                var data = JSON.parse(res.responseText);
                for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                    var player = data_1[_i];
                    var tier = getTier(player.br || 0);
                    var spanElement = document.createElement("span");
                    spanElement.className = "player";
                    spanElement.innerHTML = "<img src=\"../assets/emblems/" + tier.emblemFile + "\" class=\"tier-image\" width=\"20\" height=\"20\" alt=\"Tier\" /><span class=\"player-name\" style=\"color: #" + tier.colorCode + ";\">" + player.owner + "</span> (" + player.br + " BR)</span>";
                    var playersElement = document.getElementById("players");
                    if (playersElement)
                        playersElement.appendChild(spanElement);
                }
            });
            lastTick = Date.now();
            itr = 0, val = 0;
            interval = window.setInterval(function () {
                if (Date.now() - lastTick >= 440) {
                    if ((itr++ < 5) && val < 100) {
                        bar.style.width = (val += Math.floor(Math.random() * 5)) + "%";
                    }
                    else {
                        bar.style.width = "100%";
                        setTimeout(function () {
                            if (/[&?]mode=colors/.test(document.location.search)) {
                                details.mode = "Colors";
                            }
                            else {
                                sendOnReady(ws, JSON.stringify({
                                    op: OPCODE.HELLO,
                                    d: {
                                        session: sessionid,
                                        room: details.id
                                    }
                                }));
                                details.mode = "FFA";
                            }
                            var loadingScreen = document.getElementById("loading-screen");
                            var gameCanvas = document.getElementById("game");
                            if (loadingScreen)
                                document.body.removeChild(loadingScreen);
                            if (gameCanvas)
                                gameCanvas.style.display = "block";
                        }, 1500);
                        clearInterval(interval);
                    }
                    lastTick = Date.now();
                }
            }, 5);
            return [2];
        });
    }); })();
})();
