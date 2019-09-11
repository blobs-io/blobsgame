declare const io: Function;
declare const request: (path: string, method: string, headers?: any) => Promise<any>;
declare const socket: any;
declare const server: string;
const randomNumber: Function = (min: number, max: number): number => Math.floor(Math.random() * (max - min) + min);
const getParameterByName: Function = (param: string): string => (document.location.search.match(new RegExp(`[?&]${param}=([^&]*)`)) || [])[1];
const useSecureWS: boolean = false;

(() => {
    // -------------
    // General definitions/declarations
    // -------------
    const canvas: HTMLCanvasElement = document.getElementsByTagName("canvas")[0];
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    const sessionid: string = (() => {
        const cookie = document.cookie.split(/; */).find((v: string) => v.startsWith("session=")) || "";
        return cookie.substr(cookie.indexOf("=") + 1);
    })();
    const ws: WebSocket = new WebSocket(
        server.replace(/^https?/, "ws" + (useSecureWS ? "s" : ""))
    );
    let lastTick: number = Date.now();
    const objects: GameObject = {
        walls: [],
        items: [],
        images: {
            blobnom: null,
            brickwall: (() => {
                const image = new Image();
                image.src = "../../assets/brickwall.png";
                return image;
            })(),
            heart: (() => {
                const image = new Image();
                image.src = "http://icons.iconarchive.com/icons/paomedia/small-n-flat/1024/heart-icon.png";
                return image;
            })(),
            crown: (() => {
                const image = new Image();
                image.src = "../../assets/emblems/crown.png";
                return image;
            })()
        }
    };
    let scale: number = 1;
    const mapSize: MapProp = {
        width: 2000,
        height: 2000
    };
    const border: any = {
        left: { from: { x: 0, y: 0,}, to: { x: 0, y: 0 } },
        right: { from: { x: 0, y: 0,}, to: { x: 0, y: 0 } },
        top: { from: { x: 0, y: 0,}, to: { x: 0, y: 0 } },
        bottom: { from: { x: 0, y: 0,}, to: { x: 0, y: 0 } }
    };
    const emblems: any = {
        bronze: (() => {
            const image = new Image();
            image.src = "../../assets/emblems/emblem_bronze.png";
            return image;
        })(),
        silver: (() => {
            const image = new Image();
            image.src = "../../assets/emblems/emblem_silver.png";
            return image;
        })(),
        platinum: (() => {
            const image = new Image();
            image.src = "../../assets/emblems/emblem_platinum.png";
            return image;
        })(),
        gold: (() => {
            const image = new Image();
            image.src = "../../assets/emblems/emblem_gold.png";
            return image;
        })(),
        diamond: (() => {
            const image = new Image();
            image.src = "../../assets/emblems/emblem_diamond.png";
            return image;
        })(),
        guest: (() => {
            const image = new Image();
            image.src = "../../assets/emblems/emblem_guest-or-unknown.png";
            return image;
        })(),
        admin: (() => {
            const image = new Image();
            image.src = "../../assets/emblems/emblem_admin.png";
            return image;
        })(),
    };
    const details: any = {
        mode: getParameterByName("mode"),
        id: getParameterByName("id"),
        singleplayer: false
    };
    let ping: number = 0;
    let windowBlur: boolean = false;
    canvas.width = window.innerWidth - 30;
    canvas.height = window.innerHeight - 30;


    // -------------
    // Enums
    // -------------
    enum BlobType {
        Blobowo = "../assets/blobowo.png",
        Blobevil = "../assets/blobevil.png",
        Blobeyes = "../assets/blobeyes.png",
        Blobkittenknife = "../assets/BlobKittenKnife.png",
        Blobpeek = "../assets/blobpeek.png",
        Blobnom = "../assets/blobnom.png"
    }
    enum ItemType {
        Health = 0
    }
    enum OPCODE {
        HELLO = 1,
        HEARTBEAT = 2,
        EVENT = 3,
        CLOSE = 4
    }
    enum EventType {
        COORDINATE_CHANGE  = "coordinateChange",
        HEARTBEAT          = "heartbeat",
        KICK               = "kick",
        KICK_PLAYER        = "kickPlayer",
        NOM_KEY            = "nomKey",
        SP_NOM_KEY         = "singlePlayerNomKey",
        DIRECTION_CHANGE_C = "directionChange",
        PLAYER_NOMMED      = "playerNommed",
    }
    enum Direction {
        UP = 0,
        DOWN = 2,
        LEFT = 3,
        RIGHT = 1
    }
    enum EliminationRoomState {
        WAITING,
        COUNTDOWN,
        INGAME
    }

    // -------------
    // Interfaces
    // -------------
    interface Coordinates {
        x: number;
        y: number;
    }
    interface GameObject {
        walls: WallObject[];
        items: Item[];
        noNomAreas?: NoNomArea[];
        images: any;
    }
    interface MapProp {
        width: number;
        height: number;
    }
    interface Tier {
        tier?: string;
        colorCode?: string;
        emblemFile?: string;
    }

    // -------------
    // Structures
    // -------------
    class WallObject {
        public x: number;
        public y: number;
        public width: number;
        public height: number;
        public img: HTMLImageElement;
        public url: string;
        public type: number;
        constructor(x = randomNumber(25, canvas.width - 25),
                    y = randomNumber(25, canvas.height - 25)) {
            this.x = x;
            this.y = y;
            this.width = 30;
            this.height = 30;
            this.img = new Image();
            this.url = "../assets/brickwall.png";
            this.type = 0;
        }

        setImage(img = this.url): Promise<any> {
            return new Promise((a: any) => {
                this.img.src = img;
                this.img.onload = a;
            });
        }

        display(): Promise<any> {
            return new Promise((a: any, b: any) => {
                if (!this.img.complete) b("Image not loaded");
                if (!ctx) return;
                ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
            });
        }
    }
    class NoNomArea {
        public startsAt: Coordinates;
        public endsAt: Coordinates;

        constructor(startsAt: Coordinates, endsAt: Coordinates) {
            this.startsAt = startsAt;
            this.endsAt = endsAt;
        }

        async display(): Promise<any> {
            if (!ctx) throw new Error("ctx is null");
            ctx.fillStyle = "#aaddb5";
            ctx.fillRect(this.startsAt.x, this.startsAt.y, this.endsAt.x, this.endsAt.y);
        }
        static async display(startsAt: Coordinates, endsAt: Coordinates): Promise<any> {
            if (!ctx) throw new Error("ctx is null");
            ctx.fillStyle = "#aaddb5";
            ctx.fillRect(startsAt.x, startsAt.y, endsAt.x, endsAt.y);
        }
    }
    class BlobObject {
        public guest: boolean;
        public owner: string;
        public br: number | undefined;
        public img: HTMLImageElement;
        public direction: number;
        public lastnom: number;
        public directionChangedAt: number;
        public directionChangeCoordinates: Coordinates;
        public health: number;
        public x: number;
        public y: number;
        public role: number;
        public ready: boolean | undefined;
        public blob: BlobType;

        constructor(br: number,
                    owner: string,
                    x: number = window.innerWidth / 2,
                    y: number = window.innerHeight / 2,
                    blob: BlobType = BlobType.Blobowo) {
            this.blob = blob;
            this.guest = false;
            this.owner = owner;
            this.br = br;
            this.img = new Image();
            this.direction = 0;
            this.lastnom = 0;
            this.directionChangedAt = Date.now();
            this.directionChangeCoordinates = { x, y };
            this.health = 100;
            this.x = x;
            this.y = y;
            this.role = 0;
        }

        get inProtectedArea(): boolean {
            let inArea: boolean = false;
            let pos: Coordinates = { x: this.x, y: this.y };
            if (!objects.noNomAreas) return false;
            for (let i = 0; i < objects.noNomAreas.length; ++i) {
                if (objects.noNomAreas[i].startsAt.x <= pos.x
                    && objects.noNomAreas[i].startsAt.x + (Math.abs(objects.noNomAreas[i].endsAt.x - objects.noNomAreas[i].startsAt.x)) > pos.x
                    && objects.noNomAreas[i].startsAt.y <= pos.y
                    && objects.noNomAreas[i].startsAt.y + (Math.abs(objects.noNomAreas[i].endsAt.y - objects.noNomAreas[i].startsAt.y)) > pos.y) inArea = true;
            }
            return inArea;
        }

        setBlob(image: BlobType = BlobType.Blobowo): Promise<any> {
            return new Promise((a: any) => {
                this.img.src = image;
                this.img.onload = a;
            });
        }

        display(displayUser: boolean = false,
                displayBr: boolean = false,
                width: number = 30,
                height: number = 30): Promise<any> {
            return new Promise((a: any, b: any) => {
                if (!this.img.complete) b("Image not loaded");
                if (!ctx) return b();
                ctx.beginPath();
                const canvasX: number = canvas.width / 2 - width,
                    canvasY: number = canvas.height / 2 - height;
                const tier: Tier = getTier(this.br || 0);
                if (!tier || !tier.tier) return;
                if (this.owner === ownBlob.owner && this.owner) {
                    ctx.fillStyle = `#${tier.colorCode}`;
                    ctx.font = `${15 * scale}px Raleway`;
                    ctx.drawImage(this.img,
                        canvasX,
                        canvasY,
                        width * scale,
                        height * scale);
                    ctx.font = "16px Raleway";
                    ctx.fillText(this.owner,
                        canvasX - this.owner.length,
                        canvasY - 27.5);
                    ctx.font = "13px Raleway";
                    ctx.fillText(`${this.br} BR`,
                        canvasX,
                        canvasY - 10);
                    ctx.fillStyle = "white";
                    if (emblems[tier.tier].complete) {
                        ctx.drawImage(emblems[tier.tier],
                            canvasX - (15 + 15 * scale),
                            canvasY - (10 + 15 * scale),
                            20 * scale,
                            20 * scale);
                    }
                    ctx.strokeStyle = "lightgreen";
                    ctx.moveTo(canvasX - (35 * scale), canvasY - 3);
                    ctx.lineTo(canvasX - (35 / scale) + (100 * (this.health / 100)), canvasY - 3);
                    ctx.closePath();
                    ctx.stroke();
                    if (this.role === 1) {
                        ctx.drawImage(objects.images.crown,
                            canvasX - (30 + 30 * scale),
                            canvasY - (10 + 15 * scale),
                            20 * scale,
                            20 * scale);
                    }
                } else if (this.owner) {
                    let blobCanvasX = 0,
                        blobCanvasY = 0;
                    if (ownBlob.x >= this.x) {
                        blobCanvasX = (canvas.width / 2) - (ownBlob.x - this.x);
                    } else if (ownBlob.x < this.x) {
                        blobCanvasX = (canvas.width / 2) + (this.x - ownBlob.x);
                    }

                    if (ownBlob.y >= this.y) {
                        blobCanvasY = (canvas.height / 2) - (ownBlob.y - this.y);
                    } else if (ownBlob.y < this.y) {
                        blobCanvasY = (canvas.height / 2) + (this.y - ownBlob.y);
                    }
                    blobCanvasY -= height;
                    blobCanvasX -= width;
                    if (emblems[tier.tier].complete) {
                        ctx.drawImage(emblems[tier.tier],
                            blobCanvasX - (15 + 15 * scale),
                            blobCanvasY - (10 + 15 * scale),
                            20 * scale,
                            20 * scale);
                    }
                    ctx.fillStyle = `#${tier.colorCode}`;
                    ctx.drawImage(this.img, blobCanvasX, blobCanvasY, width * scale, height * scale);
                    if (displayUser) {
                        ctx.font = "16px Raleway";
                        ctx.fillText(this.owner,
                            blobCanvasX - this.owner.length,
                            (blobCanvasY) - 27.5);
                        ctx.font = "13px Raleway";
                        ctx.fillText(`${this.br} BR`,
                            blobCanvasX,
                            blobCanvasY - 10);
                        ctx.fillStyle = "white";
                    }
                    ctx.strokeStyle = "lightgreen";
                    ctx.moveTo(blobCanvasX - (15 + 15 * scale),
                        blobCanvasY - 3);
                    ctx.lineTo(blobCanvasX - (15 + 15 * scale) + (100 * (this.health / 100)),
                        blobCanvasY - 3);
                    ctx.closePath();
                    ctx.stroke();
                    if (this.role === 1) {
                        ctx.drawImage(objects.images.crown,
                            blobCanvasX - (30 + 30 * scale),
                            blobCanvasY - (10 + 15 * scale),
                            20 * scale,
                            20 * scale);
                    }
                }
            });
        }

        static display(blobArray: BlobObject[],
                       displayUser: boolean = false,
                       displayBr: boolean = false,
                       width: number = 30,
                       height: number = 30): void {
            for (const blob of blobArray) {
                blob.display(displayUser, displayBr, width, height).catch(console.error);
            }
        }

        static find(x: number, y: number, excludeSelf: boolean = false): BlobObject | undefined {
            let obj;
            for(let i: number = 0; i < room.blobs.length; ++i) {
                if (x < (room.blobs[i].x + 30) && x > (room.blobs[i].x - 30)) {
                    if (y < (room.blobs[i].y + 30) && y > (room.blobs[i].y - 30) && room.blobs[i].owner !== ownBlob.owner) {
                        if (excludeSelf && room.blobs[i].owner === ownBlob.owner) continue;
                        obj = room.blobs[i];
                        break;
                    }
                }
            }
            return obj;
        }
    }
    class Item {
        public x: number;
        public y: number;
        public id: ItemType;
        constructor(x = randomNumber(0, mapSize.width),
                    y = randomNumber(0, mapSize.height),
                    id = ItemType.Health) {
            this.x = x;
            this.y = y;
            this.id = id;
        }

        display(): void {
            if (!ctx) return;
            let canvasPosX = 0,
                canvasPosY = 0;
            if (ownBlob.x >= this.x) {
                canvasPosX = (canvas.width / 2) - (ownBlob.x - this.x);
            } else if (ownBlob.x < this.x) {
                canvasPosX = (canvas.width / 2) + (this.x - ownBlob.x);
            }
            if (ownBlob.y >=this.y) {
                canvasPosY = (canvas.height / 2) - (ownBlob.y - this.y);
            } else if (ownBlob.y < this.y) {
                canvasPosY = (canvas.height / 2) + (this.y - ownBlob.y);
            }
            canvasPosY -= 45;
            canvasPosX -= 45;
            ctx.drawImage(objects.images.heart, canvasPosX, canvasPosY, 20, 20);
        }

        get state(): boolean {
            return this.x < (ownBlob.x + 10) && this.x > (ownBlob.x - 10) && this.y < (ownBlob.y + 10) && this.y > (ownBlob.y - 10);
        }
    }
    class Room {
        static Type: any = {
            FFA: "ffa",
            ELIMINATION: "elimination"
        };
        public type: string;
        public blobs: BlobObject[];
        public createdAt: number;
        constructor(type: string = Room.Type.FFA, blobs: BlobObject[] = []) {
            this.type = type;
            this.blobs = [];
        }
    }
    class EliminationRoom extends Room {
        static waitingTime: number;
        public state: number;
        public countdownStarted: number;
        constructor(blobs: BlobObject[] = []) {
            super(Room.Type.ELIMINATION, blobs);
        }

        showCountdown(context: CanvasRenderingContext2D | null) {
            if (!context || !(room instanceof EliminationRoom)) return;
            const remainingTime: number = (this.createdAt + EliminationRoom.waitingTime) - Date.now();
            const remainingTimeString: string = Math.floor(remainingTime / 1000 / 60) + " minutes, " + Math.floor(remainingTime / 1000 % 60) + " seconds";
            context.font = "60px Raleway";
            if (countdownColor[0] >= 0xff) countdownColor[1] = 1;
            else if (countdownColor[0] <= 0x30) countdownColor[1] = 0;

            if (countdownColor[1] === 0) countdownColor[0] += 4;
            else countdownColor[0] -= 4;
            context.fillStyle = "#" + (countdownColor[0] > 0xff ? 0xff : countdownColor[0]).toString(16) + "0000";
            context.fillText(remainingTimeString, canvas.width / 2 - 270, canvas.height - 50);
            context.font = "30px Raleway";
            context.fillText("Waiting for players...", canvas.width / 2 - 140, canvas.height - 100);
        }
    }

    if (!details.mode)
        details.mode = Room.Type.FFA;
    if (!details.id)
        details.id = "ffa1";
    let room: EliminationRoom | Room;

    // -------------
    // Canvas
    // -------------
    function animationFrame(): any {
        if (windowBlur) {
            return window.requestAnimationFrame(animationFrame);
        }

        // FPS meter
        if (Date.now() - lastIteration > 200) {
            ownBlob.directionChangedAt = Date.now();
            ownBlob.directionChangeCoordinates.x = ownBlob.x;
            ownBlob.directionChangeCoordinates.y = ownBlob.y;
        }
        const fpsMeterElement: HTMLElement | null = document.getElementById("fps-meter");
        if(Date.now() - lastIteration > 100 && fpsMeterElement) fpsMeterElement.innerHTML = `${(10000 / (Date.now() - lastIteration)).toFixed(1)} FPS`;
        lastIteration = Date.now();

        // Blob State Check
        if (!ownBlob || !ownBlob.ready) return window.requestAnimationFrame(animationFrame);

        // Ping
        if (Date.now() - lastTick > 2500) {
            displayLeaderboard();
            const timestampBefore: number = Date.now();
            request("/api/ping", "GET").then(res => {
                const request: any = JSON.parse(res.responseText);
                const diff: number = ping = (request.arrived - timestampBefore);
                const latencyElement: HTMLElement | null = document.getElementById("latency");
                if (!latencyElement) return;
                latencyElement.innerHTML = `• Ping: <span style="color: #${diff < 100 ? '00ff00' : (diff < 200 ? 'ccff99' : (diff < 250 ? 'ffff99': (diff < 500 ? 'ff9966' : 'ff0000')))}">${diff}ms</span>`;
            });
            lastTick = Date.now();
        }

        let movable: boolean = true;
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
        if (room instanceof EliminationRoom && room.state === EliminationRoomState.COUNTDOWN) {
            room.showCountdown(ctx);
        }
        BlobObject.display(room.blobs, true, true);
    }

    let lastIteration: number = Date.now();
    let countdownColor: number[] = [0x30, 0];
    window.requestAnimationFrame(animationFrame);

    // -------------
    // Events
    // -------------
    ws.addEventListener("message", ({ data }) => {
        const { op, t: eventType, d: eventData } = JSON.parse(data);
        if (op === OPCODE.EVENT) {
            if (eventType === EventType.HEARTBEAT) {
                if (eventData.user.role === -1 && !/[?&]guest=true/.test(window.location.search))
                    return document.location.href = "/login/";

                if (details.mode === Room.Type.ELIMINATION)
                    room = new EliminationRoom();
                else room = new Room();

                // Own blob
                ownBlob.owner = eventData.user.username;
                ownBlob.blob = eventData.user.blob;
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates.x = ownBlob.x = eventData.user.x;
                ownBlob.directionChangeCoordinates.y = ownBlob.y = eventData.user.y;
                ownBlob.br = eventData.user.br;
                ownBlob.ready = true;
                ownBlob.role = eventData.user.role;
                ownBlob.setBlob(<BlobType>`../assets/${eventData.user.blob}.png`).catch(console.log);
                room.blobs.push(ownBlob);

                if (details.singleplayer)
                    eventData.users = [];
                for (let i: number = 0; i < eventData.users.length; ++i) {
                    const currentBlob: any = eventData.users[i];
                    if (currentBlob.owner === ownBlob.owner ||
                        room.blobs.some((v: BlobObject) => v.owner === currentBlob.owner)) continue;
                    const newBlob: BlobObject = new BlobObject(currentBlob.br, currentBlob.owner);
                    newBlob.directionChangeCoordinates = {
                        x: currentBlob.x,
                        y: currentBlob.y
                    };
                    newBlob.role = currentBlob.role;
                    newBlob.direction = currentBlob.direction;
                    newBlob.directionChangedAt = currentBlob.directionChangedAt;
                    newBlob.setBlob(<BlobType>`../assets/${currentBlob.blob}.png`)
                        .then(() => newBlob.display());

                    room.blobs.push(newBlob);
                }

                if (details.mode === Room.Type.ELIMINATION && room instanceof EliminationRoom) {
                    room.state = eventData.state;
                    room.createdAt = eventData.roomCreatedAt;
                    EliminationRoom.waitingTime = eventData.waitingTime;
                    room.countdownStarted = eventData.countdownStarted;
                }

                // Heartbeat
                setInterval(() => {
                    ws.send(JSON.stringify({
                        op: OPCODE.HEARTBEAT,
                        d: {
                            room: details.id
                        }
                    }));
                }, eventData.interval);
            }
            else if (eventType === EventType.COORDINATE_CHANGE) {
                if (!ownBlob || !ownBlob.ready) return;
                for (let i: number = 0; i < eventData.players.length; ++i) {
                    const currentBlob: any = eventData.players[i];
                    const target: BlobObject | undefined = room.blobs.find((v: BlobObject) => v.owner === currentBlob.owner);
                    if (!target) {
                        const newBlob: BlobObject = new BlobObject(currentBlob.br, currentBlob.owner, currentBlob.x, currentBlob.y);
                        newBlob.direction = currentBlob.direction;
                        newBlob.directionChangedAt = currentBlob.directionChangedAt;
                        newBlob.directionChangeCoordinates = currentBlob.directionChangeCoordinates;
                        newBlob.health = currentBlob.health;
                        newBlob
                            .setBlob(<BlobType>`../assets/${currentBlob.blob}.png`)
                            .then(() => newBlob.display(true, true));
                        if (room.blobs.some((v: BlobObject) => v.owner === currentBlob.owner)) return;
                        room.blobs.push(newBlob);
                    } else {
                        if (currentBlob.owner !== ownBlob.owner) {
                            target.direction = currentBlob.direction;
                            target.directionChangedAt = currentBlob.directionChangedAt;
                            target.directionChangeCoordinates = currentBlob.directionChangeCoordinates;
                            target.x = currentBlob.x;
                            target.y = currentBlob.y;
                        }
                        target.health = currentBlob.health;
                    }
                }

                for (let i: number = 0; i < room.blobs.length; ++i) {
                    const blob: number = eventData.players.findIndex((v: BlobObject) => v.owner === room.blobs[i].owner);
                    if (blob === -1) {
                        room.blobs.splice(room.blobs.findIndex((v: BlobObject) => v.owner === room.blobs[i].owner), 1);
                    }
                }
            }
            else if (eventType === EventType.KICK) {
                alert("You have been kicked.\nReason: " + (eventData.message || "-"));
            }
        }
    });

    // Mobile Controls
    const htmlButtonIDs: string[] = [
        "btnup",
        "btndown",
        "btnleft",
        "btnright",
        "nom-btn-mobile"
    ];
    for (const buttonID of htmlButtonIDs) {
        const htmlElement: HTMLElement | null = document.getElementById(buttonID);
        if (!htmlElement) continue;
        htmlElement.addEventListener("click", () => {
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
            } else if (buttonID === htmlButtonIDs[1]) {
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
            } else if (buttonID === htmlButtonIDs[2]) {
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
            } else if (buttonID === htmlButtonIDs[3]) {
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
    }

    // Kick User
    const kickMenu: HTMLElement | null = document.getElementById("kick-menu");
    {
        const kickElement: HTMLElement | null = document.getElementById("kickbtn");
        if (kickElement) {
            kickElement.addEventListener("click", () => {
                if (ownBlob.role !== 1) return;
                const targetUserElement: HTMLElement | null = document.getElementById("target-name"),
                    targetUserReason: HTMLElement | null = document.getElementById("kick-reason");
                if (!targetUserElement || !targetUserReason) return;
                ws.send(JSON.stringify({
                    op: OPCODE.EVENT,
                    t: EventType.KICK_PLAYER,
                    d: {
                        // @ts-ignore
                        user: targetUserElement.value,
                        // @ts-ignore
                        reason: targetUserReason.value,
                        room: details.id
                    }
                }));
            });
        }
        const closeMenu: HTMLElement | null = document.getElementById("closemenu");
        if (closeMenu) {
            closeMenu.addEventListener("click", () => {
                if (!kickMenu) return;
                kickMenu.style.display = "none";
            });
        }
    }

    // Resizing window
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth - 30;
        canvas.height = window.innerHeight - 30;
    });

    // Controls
    document.addEventListener("keydown", (eventd: KeyboardEvent) => {
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
                if (Date.now() - ownBlob.lastnom <= 1500) return;
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
                    const target: BlobObject | undefined = BlobObject.find(ownBlob.x, ownBlob.y, true);
                    if (!target) return;
                    nom(ownBlob, target);
                }
                break;
            case "k":
                if (ownBlob.role === 1 && kickMenu)
                    kickMenu.style.display = "block";
                break;
        }
    });

    // Window Blur / Focus
    window.addEventListener("blur", () => windowBlur = true);
    window.addEventListener("focus", () => windowBlur = false);

    const mouseScrollEvent = (...eventd: any[]): void => {
        let [event] = eventd;
        let deltaValue = 0;
        if (event.wheelDelta) {
            deltaValue = event.wheelDelta / 120;
        } else if (event.detail) {
            deltaValue = -event.detail / 3;
        }
        if (!deltaValue) return;

        if (deltaValue < 0 && scale > .5) scale -= .1;
        else if (scale < 7) scale += .1;
    };
    window.addEventListener("DOMMouseScroll", mouseScrollEvent);
    window.onmousewheel = mouseScrollEvent;

    // -------------
    // Functions
    // -------------
    function displayMinimap(context: CanvasRenderingContext2D | null = ctx): void {
        if (!context) return;
        context.beginPath();
        context.strokeStyle = "white";
        context.rect(canvas.width - 225, canvas.height - 75, 75, 75);
        context.stroke();
        context.fillStyle = "lightgreen";
        context.fillRect(canvas.width - 225 + (65 / (mapSize.width / ownBlob.x)), canvas.height - 75 + (65 / (mapSize.height / ownBlob.y)), 10, 10);
        for(let i: number = 0; i < room.blobs.length; ++i) {
            if (room.blobs[i].owner != ownBlob.owner) {
                context.fillStyle = "red";
                context.fillRect(canvas.width - 225 + (65 / (mapSize.width / room.blobs[i].x)), canvas.height - 75 + (65 / (mapSize.height / room.blobs[i].y)), 10, 10);
            }
        }
    }
    function displayHP(context: CanvasRenderingContext2D | null = ctx): void {
        if (!context) return;
        context.font = "30px Raleway";

        if (ownBlob.health >= 80) context.fillStyle = "#2ecc71";
        else if (ownBlob.health >= 50) context.fillStyle = "#f39c12";
        else if (ownBlob.health >= 30) context.fillStyle = "#e67e22";
        else if (ownBlob.health >= 10) context.fillStyle = "#e74c3c";
        else context.fillStyle = "#c0392b";

        context.fillText(ownBlob.health.toString(), canvas.width - 90, canvas.height - 30);
        context.font = "13px Raleway";
        context.fillText("HP", canvas.width - 40, canvas.height - 30);
        context.fillStyle = "white";
        window.requestAnimationFrame(animationFrame);
    }
    function displayNoNomAreas(context: CanvasRenderingContext2D | null = ctx): void {
        if (!objects.noNomAreas) return;
        for (let i: number = 0; i < objects.noNomAreas.length; ++i) {
            let canvasPosX = 0,
                canvasPosY = 0;
            if (ownBlob.x >= objects.noNomAreas[i].startsAt.x) {
                canvasPosX = (canvas.width / 2) - (ownBlob.x - objects.noNomAreas[i].startsAt.x);
            } else if (ownBlob.x < objects.noNomAreas[i].startsAt.x) {
                canvasPosX = (canvas.width / 2) + (objects.noNomAreas[i].startsAt.x - ownBlob.x);
            }
            if (ownBlob.y >= objects.noNomAreas[i].startsAt.y) {
                canvasPosY = (canvas.height / 2) - (ownBlob.y - objects.noNomAreas[i].startsAt.y);
            } else if (ownBlob.y < objects.noNomAreas[i].startsAt.y) {
                canvasPosY = (canvas.height / 2) + (objects.noNomAreas[i].startsAt.y - ownBlob.y);
            }
            canvasPosX -= 35;
            canvasPosY -= 35;
            NoNomArea
                .display({ x: canvasPosX, y: canvasPosY }, { x: Math.abs(objects.noNomAreas[i].startsAt.x - objects.noNomAreas[i].endsAt.x), y: Math.abs(objects.noNomAreas[i].startsAt.y - objects.noNomAreas[i].endsAt.y) })
                .catch(console.error);
        }
    }
    function clearCanvas(context: CanvasRenderingContext2D | null = ctx): void {
        if (!context) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
    function displayLeaderboard(): void {
        const placementColors: string[] = ["#e74c3c", "#e67e22", "#9b59b6", "#3498db", "#2980b9", "#2ecc71", "#f1c40f", "#d35400", "#8e44ad", "#16a085"];
        const leaderboardElement: HTMLElement | null = document.getElementById("leaderboard");
        if (!leaderboardElement) return;
        leaderboardElement.innerHTML = "<h3>Leaderboard</h3>";
        // @ts-ignore
        const sortedblobs: BlobObject[] = room.blobs.slice(0, 10).sort((a: BlobObject, b: BlobObject) => b.br - a.br);
        if (!sortedblobs) return;
        for (let i = 0; i < sortedblobs.length; ++i) {
            const leaderboardEntry = document.createElement("div");
            const usernameEntry = document.createElement("span");
            usernameEntry.style.color = placementColors[i];
            const brLabel = document.createElement("span");
            brLabel.style.color = placementColors[i];
            const linebreak = document.createElement("br");
            leaderboardEntry.className = "leaderboard-entry";
            usernameEntry.className = "user-entry";
            if (typeof sortedblobs[i].owner === "undefined") return;
            usernameEntry.innerHTML = (i + 1) + ". " + sortedblobs[i].owner;
            brLabel.className = "user-br";
            brLabel.innerHTML = sortedblobs[i].br + " BR";
            leaderboardElement.appendChild(leaderboardEntry);
            leaderboardElement.appendChild(usernameEntry);
            leaderboardElement.appendChild(brLabel);
            leaderboardElement.appendChild(linebreak);
        }
    }
    function displayWalls(context: CanvasRenderingContext2D | null = ctx): void  {
        if (!context) return;
        for (let i: number = 0; i < objects.walls.length; ++i) {
            let canvasPosX: number = 0,
                canvasPosY: number = 0;
            if (ownBlob.x >= objects.walls[i].x) {
                canvasPosX = (canvas.width / 2) - (ownBlob.x - objects.walls[i].x);
            } else if (ownBlob.x < objects.walls[i].x) {
                canvasPosX = (canvas.width / 2) + (objects.walls[i].x - ownBlob.x);
            }
            if (ownBlob.y >= objects.walls[i].y) {
                canvasPosY = (canvas.height / 2) - (ownBlob.y - objects.walls[i].y);
            } else if (ownBlob.y < objects.walls[i].y) {
                canvasPosY = (canvas.height / 2) + (objects.walls[i].y - ownBlob.y);
            }
            canvasPosY -= 45;
            canvasPosX -= 45;
            context.drawImage(objects.images.brickwall, canvasPosX, canvasPosY, 45, 45);
        }
    }
    function displayCooldown(context: CanvasRenderingContext2D | null = ctx): void {
        const nomCooldownElement: HTMLElement | null = document.getElementById("nom-cooldown");
        if (!nomCooldownElement) return;
        if (document.getElementById("cooldown-timer")) {
            nomCooldownElement.removeChild(<Node>document.getElementById("cooldown-timer"));
        }

        const timerElement = document.createElement("span");
        const nomReady = Date.now() - ownBlob.lastnom > 1500;
        timerElement.id = "cooldown-timer";
        timerElement.innerHTML = !nomReady ? `${((1500 - (Date.now() - ownBlob.lastnom)) / 1000).toFixed(1)}s` : "Ready";
        nomCooldownElement.appendChild(timerElement);
    }
    function displayPlayerStats(context: CanvasRenderingContext2D | null = ctx): void {
        if (!context) return;
        context.font = "15px Raleway";
        context.fillText(`X: ${Math.floor(ownBlob.x)} | Y: ${Math.floor(ownBlob.y)}`, canvas.width - 90, canvas.height - 10);
    }
    function drawBorder(context: CanvasRenderingContext2D | null = ctx): void {
        if (!context) return;
        context.beginPath();
        context.strokeStyle = "white";
        const diffXPos = ownBlob.x + (canvas.width / 2);
        const diffXNeg = ownBlob.x - (canvas.width / 2);
        const diffYPos = ownBlob.y + (canvas.height / 2);
        const diffYNeg = ownBlob.y - (canvas.height / 2);
        if (diffXPos > mapSize.width) { // right border
            context.beginPath();
            context.moveTo(border.right.from.x = (canvas.width - (diffXPos - mapSize.width)), border.right.from.y = (diffYNeg < 0 ? -(diffYNeg + 35) : 0));
            context.lineTo(border.right.to.x = (canvas.width - (diffXPos - mapSize.width)), border.right.to.y = (diffYPos > mapSize.height ? canvas.height - (diffYPos - mapSize.height) : canvas.height));
            context.closePath();
            context.stroke();
        } else if (border.right.from.x !== 0 || border.right.from.y !== 0 || border.right.to.x !== 0 || border.right.to.y !== 0) {
            border.right.from.x = border.right.from.y = border.right.to.x = border.right.to.y = 0;
        }
        if (diffXNeg < 0) { // left border
            context.beginPath();
            context.moveTo(border.left.from.x = (-(diffXNeg + 35)), border.left.from.y = (diffYNeg < 0 ? -(diffYNeg + 35) : 0));
            context.lineTo(border.left.to.x = (-(diffXNeg + 35)), border.left.to.y = (diffYPos > mapSize.height ? canvas.height - (diffYPos - mapSize.height) : canvas.height));
            context.closePath();
            context.stroke();
        } else if (border.left.from.x !== 0 || border.left.from.y !== 0 || border.left.to.x !== 0 || border.left.to.y !== 0) {
            border.left.from.x = border.left.from.y = border.left.to.x = border.left.to.y = 0;
        }
        if (diffYPos > mapSize.height) { // bottom border
            context.beginPath();
            context.moveTo(border.bottom.from.x = (diffXNeg < 0 ? -(diffXNeg + 35) : 0), border.bottom.from.y = (canvas.height - (diffYPos - mapSize.height)));
            context.lineTo(border.bottom.to.x = (diffXPos > mapSize.width ? canvas.width - (diffXPos - mapSize.width) : canvas.width), border.bottom.to.y = (canvas.height - (diffYPos - mapSize.height)));
            context.closePath();
            context.stroke();
        } else if (border.bottom.from.x !== 0 || border.bottom.from.y !== 0 || border.bottom.to.x !== 0 || border.bottom.to.y !== 0) {
            border.bottom.from.x = border.bottom.from.y = border.bottom.to.x = border.bottom.to.y = 0;
        }
        if (diffYNeg < 0) { // top border
            context.beginPath();
            context.moveTo(border.top.from.x = (diffXNeg < 0 ? -(diffXNeg + 35) : 0), border.top.from.y = (-(diffYNeg + 35)));
            context.lineTo(border.top.to.x = (diffXPos > mapSize.width ? canvas.width - (diffXPos - mapSize.width) : canvas.width), border.top.to.y = (-(diffYNeg + 35)));
            context.closePath();
            context.stroke();
        } else if (border.top.from.x !== 0 || border.top.from.y !== 0 || border.top.to.x !== 0 || border.top.to.y !== 0) {
            border.top.from.x = border.top.from.y = border.top.to.x = border.top.to.y = 0;
        }
    }
    function getTier(br: number): Tier {
        let result: Tier = {};
        if (br >= 0 && br < 2000) {
            result.tier = "bronze";
            result.colorCode = "b57156";
            result.emblemFile = "emblem_bronze.png";
        } else if (br >= 2000 && br < 4000) {
            result.tier = "silver";
            result.colorCode = "dbdbdb";
            result.emblemFile = "emblem_silver.png";
        } else if (br >= 4000 && br < 6000) {
            result.tier = "platinum";
            result.colorCode = "E5E4E2";
            result.emblemFile = "emblem_platinum.png";
        } else if (br >= 6000 && br < 9000) {
            result.tier = "gold";
            result.colorCode = "D7AF00";
            result.emblemFile = "emblem_gold.png";
        } else if (br >= 9000) {
            result.tier = "diamond";
            result.colorCode = "16f7ef";
            result.emblemFile = "emblem_diamond.png";
        }
        return result;
    }
    function nom(attackBlob: BlobObject, target: BlobObject): void {
        if (attackBlob.x < (target.x + 30) && attackBlob.x > (target.x - 30)) {
            if (attackBlob.y < (target.y + 30) && attackBlob.y > (target.y - 30)) {
                target.health -= randomNumber(30, 40);
                if (target.health <= 0) {
                    ws.send(JSON.stringify({
                        op: OPCODE.EVENT,
                        t: EventType.SP_NOM_KEY,
                        d: {
                            attackBlob,
                            target,
                            room: details.id
                        }
                    }));
                    target.health = 100;
                }
            }
        }
    }
    function sendOnReady(wsc: WebSocket, data: string) {
        if (wsc.readyState === WebSocket.OPEN) {
            wsc.send(data);
        } else if (wsc.readyState === WebSocket.CONNECTING) {
            wsc.onopen = (): any => wsc.send(data);
        }
    }



    // -------------
    // Other
    // -------------
    const ownBlob: BlobObject = new BlobObject(1000, "");
    ownBlob.ready = false;
    ownBlob
        .setBlob()
        .then(() => {
            ownBlob.display(true, true).catch(console.error);
        });
    if (/[?&]guest=true/.test(window.location.search)) {
        ownBlob.guest = true;
    }

    // Last part
    console.log("%c You know JavaScript / TypeScript? Contribute to blobs.io! https://github.com/blobs-io/blobs.io", "color: green");
    (async(): Promise<any> => {
        const bar = document.getElementById("bar-inside");
        if (!bar) return;
        request("/api/players/" + details.id, "GET", {}).then((res: any) => {
            const data: any = JSON.parse(res.responseText);
            for(const player of data) {
                const tier: any = getTier(player.br || 0);
                const spanElement: HTMLElement = document.createElement("span");
                spanElement.className = "player";
                spanElement.innerHTML = `<img src="../assets/emblems/${tier.emblemFile}" class="tier-image" width="20" height="20" alt="Tier" /><span class="player-name" style="color: #${tier.colorCode};">${player.owner}</span> (${player.br} BR)</span>`;
                const playersElement: HTMLElement | null = document.getElementById("players");
                if (playersElement)
                    playersElement.appendChild(spanElement);
            }
        });
        let lastTick: number = Date.now();
        let itr: number = 0, val: number = 0;
        const interval: number = window.setInterval(() => {
            if (Date.now() - lastTick >= 440) {
                if ((itr++ < 5) && val < 100) {
                    bar.style.width = (val += Math.floor(Math.random() * 5)) + "%";
                } else {
                    bar.style.width = "100%";
                    setTimeout(() => {
                        sendOnReady(ws,
                            JSON.stringify({
                                op: OPCODE.HELLO,
                                d: {
                                    session: sessionid,
                                    room: details.id,
                                    mode: details.mode
                                }})
                        );
                        const loadingScreen: HTMLElement | null = document.getElementById("loading-screen");
                        const gameCanvas: HTMLElement | null = document.getElementById("game");
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
    })();
})();