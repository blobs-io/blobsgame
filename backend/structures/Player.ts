// Imports
import Base from "./Base";
import Room from "./Room";
import AntiCheat from "./AntiCheat";

export enum Role {
    GUEST = -1,
    USER = 0,
    ADMIN = 1
}

// Represents a player in a room
export default class Player {
    // Regeneration constants
    static regeneration: any = {
        ratelimit: 5,
        health: 5
    };
    // The players username
    public owner: string | undefined;
    // The rating of this player
    public br: number;
    // The blob type
    public blob: string;
    // Role of this player
    public role: number;
    // Socket ID of this player
    public id: string | undefined;
    // Timestamp of when the player was nommed the last time
    public lastnom: number;
    // Direction of the player
    public direction: number;
    // Coordinates of the last direction Change
    public directionChangeCoordinates: { x?: number, y?: number };
    // Timestamp of when the player has changed the direction the last time
    public directionChangedAt: number;
    // Whether this player is a guest
    public guest: boolean;
    // Travalled distance in this room
    public distance: number;
    // The maximum possible coordinates for this map; todo: store room instead of individual properties
    public maximumCoordinates: {width?: number, height?: number};
    // Health points for this player
    public health: number;
    // AntiCheat object for this player (includes flags)
    public anticheat: AntiCheat | undefined;
    // X Coordinate
    public x: number | undefined;
    // Y Coordinate
    public y: number | undefined;
    // A reference to the base object
    public base: Base | undefined;
    // Timestamp of when the last regeneration for this user happened
    public lastRegeneration: number | undefined;
    // Timestamp of when the last heartbeat from this user was received
    public lastHeartbeat: number;

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
        this.health = 100;
        this.x = x;
        this.y = y;
        this.lastHeartbeat = Date.now();

        Object.defineProperties(this, {
            anticheat: {
                value: {},
                enumerable: false,
                writable: true
            },
            base: {
                value: base,
                enumerable: false,
                writable: true
            },
            lastRegeneration: {
                value: Date.now(),
                enumerable: false,
                writable: true
            },
            id: {
                value: null,
                enumerable: false,
                writable: true
            }
        });
    }

    // Gets the room this player is in
    get room(): Room | undefined {
        if (!this.base) return;
        return this.base.rooms.find((v: any) => v.players.some((p: any) => p.owner === this.owner));
    }


    // Checks whether the player is in a protected area (cannot be nommed)
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

    // Regenerates this players health points
    public regenerate(checkTime: boolean): void {
        if (checkTime) {
            if (!this.lastRegeneration || Date.now() - this.lastRegeneration < Player.regeneration.ratelimit * 1000) return;
        }
        if (this.health + Player.regeneration.health > 100) return void (this.health = 100);
        this.health += Player.regeneration.health;
        this.lastRegeneration = Date.now();
    }

    // Updates the distance in database
    public saveDistance(customDistance: number = this.distance): Promise<any> {
        return this.base.db.run("UPDATE accounts SET distance = distance + ? WHERE username = ?", customDistance / 1000, this.owner);
    }
}