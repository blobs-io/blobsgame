import Base from "./Base";
import Room from "./Room";

export default class Player {
    public owner: string | undefined;
    public br: number;
    public blob: string;
    public role: number;
    public id: string | undefined;
    public lastnom: number;
    public direction: number;
    public directionChangeCoordinates: { x: number | undefined, y: number | undefined };
    public directionChangedAt: number;
    public guest: boolean;
    public distance: number;
    public maximumCoordinates: {width?: number, height?: number};
    public previousX: number;
    public previousY: number;
    public health: number;
    public anticheat: any;
    public x: number | undefined;
    public y: number | undefined;
    public base: Base | undefined;

    constructor(base: Base, x?: number, y?: number, owner?: string, role: number = 0, blob: string = "blobowo") {
        this.owner = owner;
        this.br = 0;
        this.blob = blob;
        this.role = role;
        this.lastnom = Date.now();
        this.direction = 0;
        this.directionChangeCoordinates = { x, y };
        this.directionChangedAt = Date.now();
        this.guest = false;
        this.distance = 0;
        this.maximumCoordinates = { };
        this.previousX = 0;
        this.previousY = 0;
        this.health = 100;
        this.x = x;
        this.y = y;

        Object.defineProperty(this, "anticheat", {
            value: {},
            enumerable: false,
            writable: true
        });
        Object.defineProperty(this, "base", {
            value: base,
            enumerable: false,
            writable: true
        });
    }

    get room(): Room | undefined {
        if (!this.base) return;
        return this.base.rooms.find((v: any) => v.players.some((p: any) => p.owner === this.owner));
    }


    get inProtectedArea(): boolean {
        if (!this.room) return false;
        const objects: any = this.room.map.map.objects;
        let inArea: boolean = false;
        let pos: {x: number, y:number} = { x: this.x || 0, y: this.y || 0 };
        for (let i: number = 0; i < objects.noNomArea.length; ++i) {
            if (objects.noNomArea[i].startsAt.x <= pos.x
                && objects.noNomArea[i].startsAt.x + (Math.abs(objects.noNomArea[i].endsAt.x - objects.noNomArea[i].startsAt.x)) > pos.x
                && objects.noNomArea[i].startsAt.y <= pos.y
                && objects.noNomArea[i].startsAt.y + (Math.abs(objects.noNomArea[i].endsAt.y - objects.noNomArea[i].startsAt.y)) > pos.y) inArea = true;
        }
        return inArea;
    }
}