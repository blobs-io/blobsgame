declare const io: Function;
declare const request: (path: string, method: string, headers?: any) => Promise<any>;
declare const getTier: (br: number) => any;
declare const socket: any;
declare function displayMinimap(context: CanvasRenderingContext2D | null): void;
declare function displayHP(context: CanvasRenderingContext2D | null): void;
declare function displayNoNomAreas(context: CanvasRenderingContext2D | null): void;
declare function clearCanvas(context: CanvasRenderingContext2D | null): void;
declare function displayLeaderboard(): void;
declare function displayWalls(context: CanvasRenderingContext2D | null): void;
declare function displayCooldown(context: CanvasRenderingContext2D | null): void;
declare function displayPlayerStats(context: CanvasRenderingContext2D | null): void;
declare function drawBorder(context: CanvasRenderingContext2D | null): void;
declare function nom(attackBlob: any, target: any): void;

const randomNumber: Function = (min: number, max: number): number => Math.floor(Math.random() * (max - min) + min);

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
    let lastTick: number = Date.now();
    let blobs: BlobObject[];
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
        painite: (() => {
            const image = new Image();
            image.src = "../../assets/emblems/emblem_painite.png";
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
        mode: "FFA",
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
    enum EventType {
        COORDINATE_CHANGE = "coordinateChange",
        OBJECTS_HEARTBEAT = "ffaObjectsHeartbeat",
        HEARTBEAT         = "ffaHeartbeat",
        UNAUTHORIZED      = "ffaUnauthorized",
        KICK              = "ffaKick",
        USER_JOIN         = "ffaUserJoin",
        HEALTH_UPDATE     = "ffaHealthUpdate",
        DIRECTION_CHANGE  = "ffaDirectionChanged",
        LOGIN_FAILED      = "ffaLoginFailed",
        PLAYER_CREATE     = "ffaPlayerCreate",
        PLAYER_NOMMED     = "ffaPlayerNommed",
        PLAYER_DELETE     = "ffaPlayerDelete"
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
    }
    class BlobObject {
        public guest: boolean;
        public owner: string | undefined;
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

        constructor(br?: number,
                    owner?: string,
                    x: number = window.innerWidth / 2,
                    y: number = window.innerHeight / 2) {
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
                const tier = getTier(this.br || 0);
                if (!this.owner) return;
                if (this.owner === ownBlob.owner) {
                    ctx.fillStyle = `#${tier.colorCode}`;
                    ctx.font = `${15 * scale}px Dosis`;
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
                } else {
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
                blob.display(displayUser, displayBr, width, height);
            }
        }

        static find(x: number, y: number, excludeSelf: boolean = false): BlobObject | undefined {
            let obj;
            for(let i: number = 0; i < blobs.length; ++i) {
                if (x < (blobs[i].x + 30) && x > (blobs[i].x - 30)) {
                    if (y < (blobs[i].y + 30) && y > (blobs[i].y - 30) && blobs[i].owner !== ownBlob.owner) {
                        if (excludeSelf && blobs[i].owner === ownBlob.owner) continue;
                        obj = blobs[i];
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

    // -------------
    // Canvas
    // -------------
    function animationFrame(): any {
        if (windowBlur) return window.requestAnimationFrame(animationFrame);

        // FPS meter
        if (Date.now() - lastIteration > 200) { // TODO: remove this
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
                const diff: number = ping = (Date.now() - timestampBefore);
                const latencyElement: HTMLElement | null = document.getElementById("latency");
                if (!latencyElement) return;
                latencyElement.innerHTML = `• Ping: <span style="color: #${diff < 10 ? '00ff00' : (diff < 30 ? 'ccff99' : (diff < 50 ? 'ffff99': (diff < 100 ? 'ff9966' : 'ff0000')))}">${diff}ms</span>`;
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
            socket.emit(EventType.COORDINATE_CHANGE, { x: ownBlob.x, y: ownBlob.y }, "ffa");

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

    let lastIteration: number = Date.now();
    window.requestAnimationFrame(animationFrame);

    // -------------
    // Events
    // -------------
    socket.on(EventType.PLAYER_NOMMED, (eventd: any) => {
        const loser: BlobObject | undefined = blobs.find((v: BlobObject) => v.owner === eventd.loser.owner);
        const winner: BlobObject | undefined = blobs.find((v: BlobObject) => v.owner === eventd.winner.owner);
        if (!loser || !winner) return;
        loser.br = eventd.loser.br;
        winner.br = eventd.winner.br;
        loser.directionChangeCoordinates.x = eventd.loser.directionChangeCoordinates.x;
        loser.directionChangeCoordinates.y = eventd.loser.directionChangeCoordinates.y;
        loser.directionChangedAt = eventd.loser.directionChangedAt;
        loser.health = 100;
        displayLeaderboard();

        const nomHistoryDiv: HTMLElement | null = document.getElementById("nom-hist");
        const nomEntryDiv: HTMLElement = document.createElement("div");
        nomEntryDiv.className = "nom-hist-entry";
        const nomUser: HTMLElement = document.createElement("span");
        const targetUser: HTMLElement = document.createElement("span");
        nomUser.className = "nom-user nom-entry";
        nomUser.innerHTML = `${eventd.winner.owner} (+${eventd.result})`;
        const newBRLabel: HTMLElement = document.createElement("span");
        const newBRLabelLoser: HTMLElement = document.createElement("span");
        newBRLabel.className = "new-br";
        newBRLabel.innerHTML = eventd.winner.br + " BR";
        const linebreakWinner: HTMLElement = document.createElement("br");
        targetUser.className = "target-user nom-entry";
        targetUser.innerHTML = `${eventd.loser.owner} (-${eventd.result})`;
        newBRLabelLoser.className = "new-br";
        newBRLabelLoser.innerHTML = eventd.loser.br + " BR";
        const linebreakLoser: HTMLElement = document.createElement("br");
        if (!nomHistoryDiv) return;
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
    });
    socket.on(EventType.PLAYER_DELETE, (eventd: any) => {
        if (details.singleplayer) return;
        blobs.splice(blobs.findIndex((v: BlobObject) => v.owner === eventd), 1);
    });
    socket.on(EventType.LOGIN_FAILED, alert);
    socket.on(EventType.OBJECTS_HEARTBEAT, (eventd: any) => {
        for (let i: number = 0; i < eventd.walls.length; ++i) {
            const wall: WallObject = new WallObject(eventd.walls[i].x, eventd.walls[i].y);
            wall.type = eventd.walls[i].type;
            objects.walls.push(wall);
        }
        objects.noNomAreas = [];
        for (let i: number = 0; i < eventd.noNomArea.length; ++i) {
            const area: NoNomArea = new NoNomArea(eventd.noNomArea[i].startsAt, eventd.noNomArea[i].endsAt);
            objects.noNomAreas.push(area);
        }
    });
    socket.on(EventType.HEARTBEAT, (eventd: any) => {
        if (eventd.role === -1 && !/[?&]guest=true/.test(window.location.search))
            return document.location.href = "/login/";

        // Own blob
        ownBlob.owner = eventd.owner;
        ownBlob.directionChangedAt = Date.now();
        ownBlob.directionChangeCoordinates.x = ownBlob.x = eventd.x;
        ownBlob.directionChangeCoordinates.y = ownBlob.y = eventd.y;
        ownBlob.br = eventd.br;
        ownBlob.ready = true;
        ownBlob.role = eventd.role;
        blobs.push(ownBlob);

        if (details.singleplayer)
            eventd.users = [];
        for (let i: number = 0; i < eventd.users.length; ++i) {
            const currentBlob: any = eventd.users[i];
            if (currentBlob.owner === ownBlob.owner ||
                blobs.some((v: BlobObject) => v.owner === currentBlob.owner)) continue;
            const newBlob: BlobObject = new BlobObject(currentBlob.br, currentBlob.owner);
            newBlob.directionChangeCoordinates = {
                x: currentBlob.x,
                y: currentBlob.y
            };
            newBlob.role = currentBlob.role;
            newBlob.direction = currentBlob.direction;
            newBlob.directionChangedAt = currentBlob.directionChangedAt;
            newBlob.setBlob()
                .then(() => newBlob.display())
                .then(() => {
                    blobs.push(newBlob);
                });
        }
    });
    socket.on(EventType.UNAUTHORIZED, () => document.location.href = "/login");
    socket.on(EventType.KICK, (eventd: string) => {
        alert("You have been kicked.\nReason: " + (eventd || "-"));
        document.location.href = "/login/";
    });
    socket.on(EventType.DIRECTION_CHANGE, (eventd: any) => {
        if (details.singleplayer || eventd.owner === ownBlob.owner) return;
        const target: BlobObject | undefined = blobs.find((v: BlobObject) => v.owner === eventd.owner);
        if (!target) return;
        target.direction = eventd.direction;
        target.directionChangedAt = Date.now();
        target.directionChangeCoordinates = {
            x: target.x,
            y: target.y
        };
    });
    socket.on(EventType.USER_JOIN, (eventd: any) => {
        if (details.singleplayer ||
            eventd.owner === ownBlob.owner ||
            blobs.some((v: BlobObject) => v.owner === eventd.owner)) return;
        const newBlob: BlobObject = new BlobObject(eventd.br, eventd.owner);
        newBlob.directionChangeCoordinates = {
            x: eventd.x,
            y: eventd.y
        };
        newBlob.role = eventd.role;
        newBlob.directionChangedAt = eventd.directionChangedAt;
        newBlob
            .setBlob()
            .then(() => newBlob.display(true, true))
            .then(() => {
                blobs.push(newBlob);
            });
    });
    socket.on(EventType.HEALTH_UPDATE, (eventd: any) => {
        if (details.singleplayer || typeof eventd.health !== "number") return;
        const target: BlobObject | undefined = blobs.find((v: BlobObject) => v.owner === eventd.user);
        if (!target) return;
        target.health = eventd.health;
    });
    socket.on(EventType.COORDINATE_CHANGE, (eventd: any[]) => {
        if (!ownBlob || !ownBlob.ready) return;
        for (let i: number = 0; i < eventd.length; ++i) {
            const currentBlob: any = eventd[i];
            if (currentBlob.owner === ownBlob.owner) continue;
            const target: BlobObject | undefined = blobs.find((v: BlobObject) => v.owner === currentBlob.owner);
            if (!target) {
                const newBlob: BlobObject = new BlobObject(currentBlob.br, currentBlob.owner, currentBlob.x, currentBlob.y);
                newBlob
                    .setBlob()
                    .then(() => newBlob.display(true, true))
                    .then(() => {
                        if (blobs.some((v: BlobObject) => v.owner === currentBlob.owner)) return;
                        blobs.push(newBlob);
                    });
            } else {
                target.x = currentBlob.x;
                target.y = currentBlob.y;
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
                ownBlob.direction = 0; // TODO: Use enum for direction instead of hardcoded number
                if (!details.singleplayer)
                    socket.emit("ffaDirectionChange", ownBlob); // TODO: Use enum for event emit
            } else if (buttonID === htmlButtonIDs[1]) {
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 2;
                if (!details.singleplayer)
                    socket.emit("ffaDirectionChange", ownBlob);
            } else if (buttonID === htmlButtonIDs[2]) {
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 3;
                if (!details.singleplayer)
                    socket.emit("ffaDirectionChange", ownBlob);
            } else if (buttonID === htmlButtonIDs[3]) {
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 1;
                if (!details.singleplayer)
                    socket.emit("ffaDirectionChange", ownBlob);
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
                socket.emit("ffaKickPlayer", {
                    // @ts-ignore
                    user: targetUserElement.value,
                    // @ts-ignore
                    reason: targetUserReason.value
                });
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
                    socket.emit("ffaDirectionChange", ownBlob);
                break;
            case "w":
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 0;
                if (!details.singleplayer)
                    socket.emit("ffaDirectionChange", ownBlob);
                break;
            case "d":
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 1;
                if (!details.singleplayer)
                    socket.emit("ffaDirectionChange", ownBlob);
                break;
            case "s":
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 2;
                if (!details.singleplayer)
                    socket.emit("ffaDirectionChange", ownBlob);
                break;
            case "a":
                ownBlob.directionChangedAt = Date.now();
                ownBlob.directionChangeCoordinates = {
                    x: ownBlob.x,
                    y: ownBlob.y
                };
                ownBlob.direction = 3;
                if (!details.singleplayer)
                    socket.emit("ffaDirectionChange", ownBlob);
                break;
            case "n":
                if (Date.now() - ownBlob.lastnom <= 1500) return;
                ownBlob.lastnom = Date.now();
                if (!details.singleplayer)
                    socket.emit("ffaNomKey");
                else nom(ownBlob, BlobObject.find(ownBlob.x, ownBlob.y, true));
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
        if (typeof event === "undefined") event = window.event;
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
    // Other
    // -------------
    const ownBlob: BlobObject = new BlobObject();
    ownBlob.ready = false;
    ownBlob
        .setBlob()
        .then(() => {
            ownBlob.display(true, true);
        });
    if (/[?&]guest=true/.test(window.location.search)) {
        ownBlob.guest = true;
    }


    // Last part
    console.log("%c You know JavaScript / TypeScript? Contribute to blobs.io! https://github.com/blobs-io/blobs.io", "color: green");
    (async(): Promise<any> => {
        const bar = document.getElementById("bar-inside");
        if (!bar) return;
        request("/api/ffa/players", "GET", {}).then((res: any) => {
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
                if ((itr++ < 5 || !socket.connected) && val < 100) {
                    bar.style.width = (val += Math.floor(Math.random() * 5)) + "%";
                } else {
                    bar.style.width = "100%";
                    setTimeout(() => {
                        if (/[&?]mode=colors/.test(document.location.search)) {
                            details.mode = "Colors";
                        } else {
                            socket.emit(EventType.PLAYER_CREATE, sessionid, "ffa");
                            details.mode = "FFA";
                        }
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