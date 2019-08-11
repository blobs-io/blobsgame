declare const io: Function;
declare const request: (path: string, method: string, headers: any) => Promise<any>;
declare const getTier: (br: number) => any;
declare const socket: any;
declare function displayMinimap(context: CanvasRenderingContext2D): void;
declare function displayHP(context: CanvasRenderingContext2D): void;
declare function displayNoNomAreas(context: CanvasRenderingContext2D): void;
declare function clearCanvas(context: CanvasRenderingContext2D): void;
declare function displayLeaderboard(): void;
declare function displayWalls(context: CanvasRenderingContext2D): void;
declare function displayCooldown(context: CanvasRenderingContext2D): void;
declare function displayPlayerStats(context: CanvasRenderingContext2D): void;
declare function drawBorder(context: CanvasRenderingContext2D): void;
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
                       displayUser: false,
                       displayBr: false,
                       width: number,
                       height: number): void {
            for (const blob of blobArray) {
                blob.display(displayUser, displayBr, width, height);
            }
        }

        static find(x: number, y: number): BlobObject | undefined {
            let obj;
            for(let i: number = 0; i < blobs.length; ++i) {
                if (x < (blobs[i].x + 30) && x > (blobs[i].x - 30)) {
                    if (y < (blobs[i].y + 30) && y > (blobs[i].y - 30) && blobs[i].owner !== ownBlob.owner) {
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

    }

    let lastIteration: number = Date.now();
    window.requestAnimationFrame(animationFrame);



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
                            socket.emit("ffaPlayerCreate", sessionid, "ffa");
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