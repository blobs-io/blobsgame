declare const io: Function;
declare const server: string;
// @ts-ignore
declare class RestClient {
    public _key: string;
    public key: string;
    public authType: string;
    public api: string;
    public computedHeaders: any;

    constructor(key: string, authType: "Session", api?: string);

    fetchPromotions(): Promise<any[]>;
    fetchUser(user: string): Promise<any>;
    fetchRooms(): Promise<any>;
    fetchRoom(id: string): Promise<any>;
    fetchPlayers(roomId: string): Promise<any>;
    switchBlob(newBlob: string): Promise<any>;
    redeemDailyBonus(): Promise<any>;
    ping(): Promise<number>;
    static extractSessionID(): string;
}
// functions.js
declare function modeToString(mode: number): string;

const rest: RestClient = new RestClient(RestClient.extractSessionID(), "Session");

function randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
}

function getParameterByName(param: string): string {
    const matches: RegExpMatchArray | null = document.location.search.match(new RegExp(`[?&]${param}=([^&]*)`));
    return matches ? matches[1] : "";
}

function formatDiff(time: any): string {
    const remainingTime: number = time - Date.now();
    return Math.floor(remainingTime / 1000 / 60) + " minutes, " + Math.floor(remainingTime / 1000 % 60) + " seconds";
}

function createImage(src: string): any {
    const img = new Image();
    img.src = src;
    return img;
}

function getRelativeCoordinates(x: number, y: number, ownBlob: {x: number, y: number}, canvasSize: {width: number, height: number}, objSize: {width: number, height: number} = {width: 30, height: 30}): {canvasX: number, canvasY: number} {
    let canvasX = 0,
        canvasY = 0;
    if (ownBlob.x >= x) {
        canvasX = (canvasSize.width / 2) - (ownBlob.x - x);
    } else if (ownBlob.x < x) {
        canvasX = (canvasSize.width / 2) + (x - ownBlob.x);
    }

    if (ownBlob.y >= y) {
        canvasY = (canvasSize.height / 2) - (ownBlob.y - y);
    } else if (ownBlob.y < y) {
        canvasY = (canvasSize.height / 2) + (y - ownBlob.y);
    }
    canvasY -= objSize.height;
    canvasX -= objSize.width;

    return {
        canvasX,
        canvasY
    };
}

const useSecureWS: boolean = !document.location.href.startsWith("http://");

// Phone controls
if (["Android", "iOS"].some(v => window.navigator.userAgent.includes(v))) {
    const controlsElement: HTMLElement | null = document.getElementById("dpad-controls");
    if (controlsElement)
        controlsElement.style.display = "block";
}

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
        server.replace(/^https?/, "ws" + (useSecureWS ? "s" : "")) + "/ws"
    );
    const objects: GameObject = {
        walls: [],
        items: [],
        images: {
            blobnom: null,
            brickwall: createImage("../../assets/brickwall.png"),
            heart: createImage("../../assets/emblems/heart.png"),
            coin: createImage("../../assets/emblems/emblem_blobcoin.png"),
            crown: createImage("../../assets/emblems/crown.png")
        }
    };
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
        bronze: createImage("../../assets/emblems/emblem_bronze.png"),
        silver: createImage("../../assets/emblems/emblem_silver.png"),
        platinum: createImage("../../assets/emblems/emblem_platinum.png"),
        gold: createImage("../../assets/emblems/emblem_gold.png"),
        diamond: createImage("../../assets/emblems/emblem_diamond.png"),
        guest: createImage("../../assets/emblems/emblem_guest-or-unknown.png"),
        admin: createImage("../../assets/emblems/emblem_admin.png")
    };
    const details: any = {
        mode: parseInt(getParameterByName("mode"), 10),
        id: getParameterByName("id"),
        singleplayer: false
    };
    let ping: number = 0;
    let windowBlur: boolean = false;
    let scale: number = 1;
    let lastTick: number = Date.now();
    let showWSCloseNotification = true;
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
    enum BlobID {
        Blobowo,
        Blobevil,
        Blobeyes,
        Blobkittenknife,
        Blobpeek,
        Blobnom
    }
    enum ItemType {
        HEALTH = 0,
        COIN   = 1
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
        NOM_KEY            = "nomKey",
        STATECHANGE        = "stateChange",
        SP_NOM_KEY         = "singlePlayerNomKey",
        DIRECTION_CHANGE_C = "directionChange",
        PLAYER_NOMMED      = "playerNom",
        COLLECT_ITEM       = "itemCollect",
        ITEM_UPDATE        = "itemUpdate",
        STATSCHANGE        = "statsChange"
    }
    enum KickTypes {
        ROOM_FULL = "roomFull",
        ROOM_INGAME = "roomIngame",
        TOO_MANY_SOCKETS = "tooManySockets",
        CLIENT_MOD = "clientMod",
        MOD_KICK = "modKick",
        ELIMINATED = "eliminated",
        WIN = "win",
        ROOM_END = "roomEnd"
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
        INGAME,
        ENDED
    }

    enum Currency {
        COINS,
        BR
    }

    const CoinChangeTable: any = {
        1: 75,
        2: 50,
        3: 25
    };

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
        static width: number = 30;
        static height: number = 30;
        public guest: boolean;
        public username: string;
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
        public collision: boolean;
        public coins: number;
        public hudColors: number[];

        constructor(br: number,
                    username: string,
                    x: number = window.innerWidth / 2,
                    y: number = window.innerHeight / 2,
                    blob: BlobType = BlobType.Blobowo) {
            this.blob = blob;
            this.guest = false;
            this.username = username;
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
            this.collision = true;
            this.coins = 0;
            this.hudColors = [];
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

        animate(): void {
            if (!ctx) return;
            for(let i = 0; i < this.hudColors.length; ++i) {
                ctx.font = "15px Raleway";
                if (this.hudColors[i] <= 0x80) {
                    this.hudColors.splice(i, 1);
                } else {
                    // TODO: this will only work if color is supposed to be green
                    const { canvasX, canvasY } = getRelativeCoordinates(
                        this.x,
                        this.y,
                        {
                            x: ownBlob.x,
                            y: ownBlob.y
                        },
                        {
                            width: canvas.width,
                            height: canvas.height
                        },
                        {
                            height: 50,
                            width: 50
                        }
                    );
                    ctx.fillStyle = "#00" + (this.hudColors[i].toString(16).padStart(2, "0")) + "00";
                    ctx.fillText("50 XP", canvasX + 15, (canvasY - 70) + (this.hudColors[i] / 4));
                    this.hudColors[i] -= 3;
                }
            }
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
                if (this.username === ownBlob.username && this.username) {
                    ctx.fillStyle = `#${tier.colorCode}`;
                    ctx.font = `${15 * scale}px Raleway`;
                    ctx.drawImage(this.img,
                        canvasX,
                        canvasY,
                        width * scale,
                        height * scale);
                    ctx.font = "16px Raleway";
                    ctx.fillText(this.username,
                        canvasX - this.username.length,
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
                } else if (this.username) {
                    const { canvasX: blobCanvasX, canvasY: blobCanvasY } = getRelativeCoordinates(
                        this.x,
                        this.y,
                        {
                            x: ownBlob.x,
                            y: ownBlob.y
                        },
                        {
                            width: canvas.width,
                            height: canvas.height
                        },
                        {
                            width,
                            height
                        }
                    );

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
                        ctx.fillText(this.username,
                            blobCanvasX - this.username.length,
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
                    if (y < (room.blobs[i].y + 30) && y > (room.blobs[i].y - 30) && room.blobs[i].username !== ownBlob.username) {
                        if (excludeSelf && room.blobs[i].username === ownBlob.username) continue;
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
        public type: ItemType;
        public id: string;
        public static animationScale: number = 0;
        public static animationState: boolean = true; // 1 = up, 0 = approach original value
        public static animationScaleLimit: number = -15;
        public static width: number = 20;
        public static height: number = 20;
        constructor(type: ItemType,
                    x = randomNumber(0, mapSize.width),
                    y = randomNumber(0, mapSize.height)) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.id = "";
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
            if (ownBlob.y >= this.y) {
                canvasPosY = (canvas.height / 2) - (ownBlob.y - this.y);
            } else if (ownBlob.y < this.y) {
                canvasPosY = (canvas.height / 2) + (this.y - ownBlob.y);
            }
            canvasPosY -= 45;
            canvasPosX -= 45;
            ctx.drawImage(objects.images[this.toString()], canvasPosX, canvasPosY + Item.animationScale, Item.width, Item.height);
        }

        get state(): boolean {
            return this.x < (ownBlob.x + (Item.width / 2)) && this.x > (ownBlob.x - (Item.width / 2)) && this.y < (ownBlob.y + (Item.height / 2)) && this.y > (ownBlob.y - (Item.height / 2));
        }

        toString(): string {
            if (this.type === ItemType.COIN) return "coin";
            else if (this.type === ItemType.HEALTH) return "heart";
            else throw new ReferenceError("Invalid type");
        }
    }
    class Room {
        static Type: any = {
            FFA: "ffa",
            ELIMINATION: "elimination"
        };
        static TypeID: any = {
            FFA: 0,
            ELIMINATION: 1
        };
        public type: string;
        public blobs: BlobObject[];
        public createdAt: number;
        public rewards: {
            text: string;
            gain: number;
            gainCurrency: Currency;
            pos: number;
        }[];
        public resultColor: number;
        public resultColorState: number;
        public won: boolean;

        constructor(type: string = Room.Type.FFA, blobs: BlobObject[] = []) {
            this.type = type;
            this.blobs = blobs;
            this.rewards = [];
            this.resultColor = this.resultColorState = 0;
            this.won = false;
            this.createdAt = Date.now();
        }
    }
    class EliminationRoom extends Room {
        static waitingTime: number;
        public state: number;
        public countdownStarted: number;
        constructor(blobs: BlobObject[] = []) {
            super(Room.Type.ELIMINATION, blobs);
            this.state = EliminationRoomState.WAITING;
            this.countdownStarted = Date.now();
        }

        showCountdown(context: CanvasRenderingContext2D | null): void {
            if (!context || !(room instanceof EliminationRoom)) return;
            const remainingTimeString: string = formatDiff(this.countdownStarted + EliminationRoom.waitingTime);
            context.font = "60px Raleway";
            if (countdownColor[0] >= 0xff) countdownColor[1] = 1;
            else if (countdownColor[0] <= 0x30) countdownColor[1] = 0;

            if (countdownColor[1] === 0) countdownColor[0] += 4;
            else countdownColor[0] -= 4;
            context.fillStyle = "#" + (countdownColor[0] > 0xff ? 0xff : countdownColor[0]).toString(16) + "0000";
            if (room.state === EliminationRoomState.COUNTDOWN) {
                context.fillText(remainingTimeString, canvas.width / 2 - 270, canvas.height - 50);
            }
            context.font = "30px Raleway";
            context.fillText("Waiting for players...", canvas.width / 2 - 140, canvas.height - 100);
        }

        showResults(): void { // todo: noms as BlobObj prototype property
            if (!ctx) return;
            if (this.resultColorState === 0) {
                if (this.resultColor >= 0xfa) this.resultColorState = 1;
                else this.resultColor += 2;
            } else {
                if (this.resultColor <= 0x10) this.resultColorState = 0;
                else this.resultColor -= 2;
            }

            const colorHex = this.resultColor.toString(16);
            ctx.font = "32px Raleway";
            ctx.fillStyle = this.won ? `#00${colorHex + (colorHex.length < 2 ? "0" : "")}00` : `#${colorHex + (colorHex.length < 2 ? "0" : "")}0000`;
            ctx.fillText(this.won ? "You won!" : "You died", canvas.width / 2 - 100, canvas.height / 2 - 150);

            ctx.fillStyle = "#ffffff";
            ctx.font = "20px Raleway";
            for (let i = 0; i < this.rewards.length; ++i) {
                const reward = this.rewards[i];
                if (reward.pos <= (canvas.width / 2 - 150)) reward.pos += 50;
                ctx.fillText(reward.text, reward.pos, canvas.height / 2 - (50 - (i * 25)));
                ctx.fillText("+" + reward.gain + " " + EliminationRoom.currencyToString(reward.gainCurrency), canvas.width / 2 + 30, canvas.height / 2 - (50 - (i * 25)));
            }
        }

        static currencyToString(currency: Currency): string {
            if (currency === Currency.BR) return "BR";
            else if (currency === Currency.COINS) return "Coins";
            else return "";
        }
    }

    if (isNaN(details.mode))
        details.mode = Room.Type.FFA;
    if (details.id.length === 0)
        details.id = "ffa1";
    let room: EliminationRoom | Room;

    // -------------
    // Canvas
    // -------------
    async function animationFrame(): Promise<any> {
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
        if ((!ownBlob || !ownBlob.ready) && !(room instanceof EliminationRoom && room.state === EliminationRoomState.ENDED)) return window.requestAnimationFrame(animationFrame);

        // Ping
        if (Date.now() - lastTick > 2500) {
            displayLeaderboard();
            ping = await rest.ping();

            const latencyElement: HTMLElement | null = document.getElementById("latency");
            if (!latencyElement) return;

            latencyElement.innerHTML = `• Ping: <span style="color: #${ping < 100 ? '00ff00' : (ping < 200 ? 'ccff99' : (ping < 250 ? 'ffff99': (ping < 500 ? 'ff9966' : 'ff0000')))}">${ping}ms</span>`;
            lastTick = Date.now();
        }

        let movable: boolean = true;
        if ((ownBlob.role !== 1 || ownBlob.collision) && ownBlob.x < 0) {
            ownBlob.direction = 4;
            ownBlob.x = 0;
            movable = false;
        }
        else if ((ownBlob.role !== 1 || ownBlob.collision) && ownBlob.y < 0) {
            ownBlob.direction = 4;
            ownBlob.y = 0;
            movable = false;
        }
        else if ((ownBlob.role !== 1 || ownBlob.collision) && ownBlob.y > mapSize.height) {
            ownBlob.direction = 4;
            ownBlob.y = mapSize.height;
            movable = false;
        }
        else if ((ownBlob.role !== 1 || ownBlob.collision) && ownBlob.x > mapSize.width) {
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
        displayCoins(ctx);

        // Item animation
        if (Item.animationState) {
            if (Item.animationScale <= Item.animationScaleLimit)
                Item.animationState = false;
            else
                Item.animationScale -= 0.3;
        } else {
            if (Item.animationScale >= 0)
                Item.animationState = true;
            else
                Item.animationScale += 0.3;
        }

        // Show items
        for (const item of objects.items) {
            item.display();
        }

        // Show countdown if room is Elimination Room
        if (room instanceof EliminationRoom) {
            if (room.state === EliminationRoomState.COUNTDOWN || room.state === EliminationRoomState.WAITING) {
                room.showCountdown(ctx);
            } else if (room.state === EliminationRoomState.ENDED) {
                room.showResults();
            }
        }
        for (const blob of room.blobs) {
            blob.display(true, true).catch(console.log);
            blob.animate();
        }
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
                console.log(eventData);
                if (eventData.user.role === -1 && !/[?&]guest=true/.test(window.location.search))
                    return document.location.href = "/login/";

                if (details.mode === Room.Type.ELIMINATION)
                    room = new EliminationRoom();
                else room = new Room();

                // Items
                for(const item of eventData.items) {
                    const itemObj: Item = new Item(item.type, item.x, item.y);
                    itemObj.id = item.id;
                    objects.items.push(itemObj);
                }

                // Own blob
                ownBlob.username = eventData.user.username;
                ownBlob.blob = eventData.user.blob;
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates.x = ownBlob.x = eventData.user.x;
                ownBlob.directionChangeCoordinates.y = ownBlob.y = eventData.user.y;
                ownBlob.br = eventData.user.br;
                ownBlob.ready = true;
                ownBlob.role = eventData.user.role;
                ownBlob.coins = eventData.user.coins;
                ownBlob.setBlob(<BlobType>`../assets/${eventData.user.blob}.png`).catch(console.log);
                room.blobs.push(ownBlob);

                if (details.singleplayer)
                    eventData.users = [];
                for (let i: number = 0; i < eventData.users.length; ++i) {
                    const currentBlob: any = eventData.users[i];
                    if (currentBlob.username === ownBlob.username ||
                        room.blobs.some((v: BlobObject) => v.username === currentBlob.username)) continue;
                    const newBlob: BlobObject = new BlobObject(currentBlob.br, currentBlob.username);
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
                    const target: BlobObject | undefined = room.blobs.find((v: BlobObject) => v.username === currentBlob.username);
                    if (!target) {
                        const newBlob: BlobObject = new BlobObject(currentBlob.br, currentBlob.username, currentBlob.x, currentBlob.y);
                        newBlob.direction = currentBlob.direction;
                        newBlob.directionChangedAt = currentBlob.directionChangedAt;
                        newBlob.directionChangeCoordinates = currentBlob.directionChangeCoordinates;
                        newBlob.health = currentBlob.health;
                        newBlob
                            .setBlob(<BlobType>`../assets/${currentBlob.blob}.png`)
                            .then(() => newBlob.display(true, true));
                        if (room.blobs.some((v: BlobObject) => v.username === currentBlob.username)) return;
                        room.blobs.push(newBlob);
                    } else {
                        if (currentBlob.username !== ownBlob.username) {
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
                    const blob: number = eventData.players.findIndex((v: BlobObject) => v.username === room.blobs[i].username);
                    if (blob === -1) {
                        room.blobs.splice(room.blobs.findIndex((v: BlobObject) => v.username === room.blobs[i].username), 1);
                    }
                }
            }
            else if (eventType === EventType.STATECHANGE) {
                if (room instanceof EliminationRoom) {
                    room.countdownStarted = eventData.countdownStarted;
                    room.state = eventData.state;
                }
            }
            else if (eventType === EventType.PLAYER_NOMMED && room.type === Room.Type.FFA) {
                displayLeaderboard();
                const loser: BlobObject | undefined = room.blobs.find(b => b.username === eventData.loser.username);
                const winner: BlobObject | undefined = room.blobs.find(b => b.username === eventData.winner.username);

                if (!loser || !winner) return;

                loser.br = eventData.loser.br;
                loser.directionChangeCoordinates.x = eventData.loser.directionChangeCoordinates.x;
                loser.directionChangeCoordinates.y = eventData.loser.directionChangeCoordinates.y;
                loser.directionChangedAt = eventData.loser.directionChangedAt;
                loser.health = 100;
                
                winner.br = eventData.winner.br;

                winner.hudColors.push(0xff);

                // HTML Elements, ...
                const nomHistoryDiv = document.getElementById("nom-hist");
                if (!nomHistoryDiv) return;
                const nomEntryDiv = document.createElement("div");
                nomEntryDiv.className = "nom-hist-entry";
                const nomUser = document.createElement("span");
                const targetUser = document.createElement("span");
                nomUser.className = "nom-user nom-entry";
                nomUser.innerHTML = `${winner.username} (+${eventData.result})`;
                const newBRLabel = document.createElement("span");
                const newBRLabelLoser = document.createElement("span");
                newBRLabel.className = "new-br";
                newBRLabel.innerHTML = winner.br + " BR";
                const linebreakWinner = document.createElement("br");
                targetUser.className = "target-user nom-entry";
                targetUser.innerHTML = `${loser.username} (-${eventData.result})`;
                newBRLabelLoser.className = "new-br";
                newBRLabelLoser.innerHTML = loser.br + " BR";
                const linebreakLoser = document.createElement("br");
                nomHistoryDiv.appendChild(nomEntryDiv);
                nomEntryDiv.appendChild(nomUser);
                nomEntryDiv.appendChild(newBRLabel);
                nomEntryDiv.appendChild(linebreakWinner);
                nomEntryDiv.appendChild(targetUser);
                nomEntryDiv.appendChild(newBRLabelLoser);
                nomEntryDiv.appendChild(linebreakLoser);

                setTimeout(() => {
                    nomHistoryDiv.removeChild(nomEntryDiv);
                }, 3500);
            }
            else if (eventType === EventType.ITEM_UPDATE) {
                console.log(eventData);
                if (typeof eventData.old === "string") { // removed item
                    const item: number = objects.items.findIndex(i => i.id === eventData.old);
                    if (item < 0) return; // item somehow not found
                    objects.items.splice(item, 1);
                }
                if (eventData.new && Object.keys(eventData.new).length > 0) { // new item
                    const item: Item = new Item(eventData.new.type, eventData.new.x, eventData.new.y);
                    item.id = eventData.new.id;
                    objects.items.push(item);
                }
            }
            else if (eventType === EventType.STATSCHANGE) {
                for (const prop of Object.getOwnPropertyNames(eventData)) {
                    (ownBlob as any)[prop] = eventData[prop];
                }
            }
        } else if (op === OPCODE.CLOSE) {
            let kickReason: string = "You have been kicked.\nReason: " + (eventData.message || ""), showAlert: boolean = true;
            switch (eventData.type) {
                case KickTypes.CLIENT_MOD:
                    kickReason += "\nThis is probably due to (a) client modification(s). Avoid doing so, as it is against the rules."
                break;
                case KickTypes.ELIMINATED:
                    if (room instanceof EliminationRoom) {
                        room.rewards.push({
                            text: room.blobs.length + (room.blobs.length === 1 
                                ? "st" : (room.blobs.length === 2 
                                ? "nd" : (room.blobs.length === 3 ? "rd" : "th"))) + " place",
                            gain: CoinChangeTable[room.blobs.length] || 0,
                            gainCurrency: Currency.COINS,
                            pos: 0
                        });
                        room.rewards.push({
                            text: room.blobs.length + (room.blobs.length === 1 
                                ? "st" : (room.blobs.length === 2 
                                ? "nd" : (room.blobs.length === 3 ? "rd" : "th"))) + " place",
                            gain: eventData.result,
                            gainCurrency: Currency.BR,
                            pos: 0
                        });
                        room.rewards.push({
                            text: eventData.noms + " noms",
                            gain: 5 * eventData.noms,
                            gainCurrency: Currency.COINS,
                            pos: 0
                        });
                        room.state = EliminationRoomState.ENDED;
                        room.won = false;
                    }
                    showAlert = false;
                break;
                case KickTypes.MOD_KICK:
                    kickReason += "\nThis is a mod-kick, which means that a moderator has noticed that you have violated the rules and taken action by kicking you from this room.\n";
                break;
                case KickTypes.WIN:
                console.log(eventData);
                    if (room instanceof EliminationRoom) {
                        room.rewards.push({
                            text: "1st place",
                            gain: CoinChangeTable[room.blobs.length] || 0,
                            gainCurrency: Currency.COINS,
                            pos: 0
                        });
                        room.rewards.push({
                            text: "1st place",
                            gain: eventData.result,
                            gainCurrency: Currency.BR,
                            pos: 0
                        });
                        room.rewards.push({
                            text: eventData.noms + " noms",
                            gain: 5 * eventData.noms,
                            gainCurrency: Currency.COINS,
                            pos: 0
                        });
                        room.state = EliminationRoomState.ENDED;
                        room.won = true;
                    }
                    showAlert = false;
                break;
            }
            
            if (showAlert) alert(kickReason)
            showWSCloseNotification = false;
            ownBlob.ready = false;
            room.blobs.splice(room.blobs.findIndex(b => b.username === ownBlob.username), 1);
        }
    });
    ws.onclose = () => {
        if (showWSCloseNotification) {
            alert("Connection closed.");
            document.location.href = "/";
        }
    };

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

    {
        const quitButton: HTMLElement | null = document.getElementById("quit");
        if (quitButton) {
            quitButton.addEventListener("click", () => {
                ws.send(JSON.stringify({
                    op: OPCODE.CLOSE,
                    d: {
                        room: details.id
                    }
                }));
            });
        }
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
                    t: EventType.KICK,
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
        const toggleCollisionElement: HTMLElement | null = document.getElementById("toggle-collision");
        if (toggleCollisionElement) {
            toggleCollisionElement.addEventListener("click", () => {
                ownBlob.collision = !ownBlob.collision;
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
            case "c":
                //TODO: this doesn't work properly yet, sometimes selectedItem is undefined
                const selectedItem: Item | undefined = objects.items.find(i => ownBlob.x < (i.x + Item.width) && ownBlob.x > (i.x - Item.width) && ownBlob.y < (i.y + Item.height) && ownBlob.y > (i.y - Item.height));
                console.log(selectedItem);
                if (!selectedItem) return;
                ws.send(JSON.stringify({
                    op: OPCODE.EVENT,
                    t: EventType.COLLECT_ITEM,
                    d: {
                        room: details.id,
                        item: selectedItem.id
                    }
                }));
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
            if (room.blobs[i].username !== ownBlob.username) {
                context.fillStyle = "red";
                context.fillRect(canvas.width - 225 + (65 / (mapSize.width / room.blobs[i].x)), canvas.height - 75 + (65 / (mapSize.height / room.blobs[i].y)), 10, 10);
            }
        }
    }
    function displayHP(context: CanvasRenderingContext2D | null = ctx): void {
        if (!context) return;
        context.font = "15px Raleway";

        if (ownBlob.health >= 80) context.fillStyle = "#2ecc71";
        else if (ownBlob.health >= 50) context.fillStyle = "#f39c12";
        else if (ownBlob.health >= 30) context.fillStyle = "#e67e22";
        else if (ownBlob.health >= 10) context.fillStyle = "#e74c3c";
        else context.fillStyle = "#c0392b";

        context.fillText("HP: " + ownBlob.health, canvas.width - 100, canvas.height - 10);
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
            if (typeof sortedblobs[i].username === "undefined") return;
            usernameEntry.innerHTML = (i + 1) + ". " + sortedblobs[i].username;
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
        context.fillText("X: "+ Math.floor(ownBlob.x), canvas.width - 100, canvas.height - 50);
        context.fillText("Y: "+ Math.floor(ownBlob.y), canvas.width - 100, canvas.height - 70);
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
    function displayCoins(context: CanvasRenderingContext2D | null) {
        if (!context) return;
        context.beginPath();
        context.font = "15px Raleway";
        context.fillStyle = "white";
        context.fillText("Coins: " + ownBlob.coins, canvas.width - 100, canvas.height - 30);
        context.closePath();
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


    function modeToFullString(mode: number): string {
        switch (mode) {
            case Room.TypeID.FFA:
                return "Free For All";
                break;
            case Room.TypeID.ELIMINATION:
                return "Elimination";
                break;
            default:
                return "";
                break;
        }
    }
    // Last part
    console.log("%c You know JavaScript / TypeScript? Contribute to blobs! https://github.com/blobs-io/blobs.live", "color: green");
    (async(): Promise<any> => {
        {
            const headingElement: HTMLCollection = document.getElementsByClassName("heading");
            if (headingElement && headingElement[1]) {
                headingElement[1].innerHTML = modeToFullString(details.mode) || "Unknown Gamemode";
            }
        }
        const bar = document.getElementById("bar-inside");
        if (!bar) return;

        const data = await rest.fetchPlayers(details.id).then(v => v.json());

        for(const player of data) {
            const tier: any = getTier(player.br || 0);
            const spanElement: HTMLElement = document.createElement("span");
            spanElement.className = "player";
            spanElement.innerHTML = `<img src="../assets/emblems/${tier.emblemFile}" class="tier-image" width="20" height="20" alt="Tier" /><span class="player-name" style="color: #${tier.colorCode};">${player.username}</span> (${player.br} BR)</span>`;
            const playersElement: HTMLElement | null = document.getElementById("players");
            if (playersElement)
                playersElement.appendChild(spanElement);
        }

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
