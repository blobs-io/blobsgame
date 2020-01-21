// Imports
import Base from "./Base";
import Room from "./Room";
import AntiCheat from "./AntiCheat";
import { wsSocket } from "./Socket";
import * as EliminationRoom from "./EliminationRoom";
import LevelSystem from "../utils/LevelSystem";
import Clan, { ClanData } from "./Clan";
import ClanController from "../clans/ClanController";

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
    public x: number;
    // Y Coordinate
    public y: number;
    // A reference to the base object; ts-ignore because it is defined using Object.defineProperties
    // @ts-ignore
    public base: Base;
    // Timestamp of when the last regeneration for this user happened
    public lastRegeneration: number | undefined;
    // Timestamp of when the last heartbeat from this user was received
    public lastHeartbeat: number;
    // The number of coins this user has
    public coins: number;
    // The number of times how often this player has won against another player
    public noms: number;
    // Experience points of this player
    public xp: number;

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
        this.x = x || 0;
        this.y = y || 0;
        this.lastHeartbeat = Date.now();
        this.noms = 0;
        this.coins = 0;
        this.xp = 0;

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
            },
            coins: {
                value: 0,
                enumerable: false,
                writable: true
            },
            xp: {
                value: 0,
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

    get level(): number {
        return LevelSystem.xpToLevel(this.xp);
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
    public async saveDistance(customDistance: number = this.distance): Promise<any> {
        if (!this.base.db) return;
        return this.base.db.query(`UPDATE accounts SET "distance" = "distance" + $1, "xp" = "xp" + $2 WHERE "username" = $3`, [
            Math.floor(customDistance),
            Math.floor(customDistance / 12),
            this.owner
        ]);
    }

    // Sends a websocket message to this player
    public wsSend(str: string): void {
        const socket: wsSocket | undefined = this.base.wsSockets.find(v => v.id === this.id);
        if (!socket) return;
        socket.conn.send(str);
    }

    // Function to update BR/XP and do other recommended checks, such as level checks, ...
    // TODO: change arguments to object and make properties optional
    // dynamically add columns to query that are needed for update
    public update(br: number, coins: number, xp: number): void {
        if (!this.guest && this.base.db) {
            let query = `UPDATE accounts SET "blobcoins" = "blobcoins" + $1, "br" = "br" + $2, "xp" = "xp" + $3 WHERE "username" = $4`;
            if (this.br + br > 9999) query = query.replace(`, "br" = "br" + $2`, `, "br" = 9999`);
            
            if (query.includes(`, "br" = "br" + $2`))
                this.base.db.query(query, [coins, br, xp, this.owner]);
            else
                this.base.db.query(query, [coins, xp, this.owner]);
        }
    }

    public static async joinClan(clan: ClanData, player: Player | String, base: Base): Promise<ClanData | undefined> {
        if (!base.db) throw new Error("DB instance not present");
        const targetPlayer = player instanceof Player ? player.owner : player,
              parsedMembers = JSON.parse(clan.members);

        if (!clan.joinable) throw new Error("This clan is not joinable");
        if (parsedMembers.includes(targetPlayer)) throw new Error("Requested user is already in this clan");
        if (parsedMembers.length >= ClanController.MemberLimit) throw new Error("Clan is full");
        if (((await base.db.query(`SELECT "clan" FROM accounts WHERE "username" = $1`, [targetPlayer])).rows[0] || {}).clan) throw new Error("Requested user is already in another clan");

        parsedMembers.push(targetPlayer);
        await base.db.query(`UPDATE accounts SET "clan" = $1 WHERE "username" = $2`, [clan.name, targetPlayer]);
        await base.db.query(`UPDATE clans SET "members" = $1 WHERE "name" = $2`, [JSON.stringify(parsedMembers), clan.name]);
        return clan;
    }

    public static async leaveClan(clan: ClanData, player: Player | string, base: Base): Promise<ClanData> {
        if (!base.db) throw new Error("DB instance not present");
        const targetPlayer = player instanceof Player ? player.owner : player,
              parsedMembers = JSON.parse(clan.members);

        parsedMembers.splice(parsedMembers.indexOf(targetPlayer), 1);
        await base.db.query(`UPDATE accounts SET "clan" = $1 WHERE "username" = $2`, [null, targetPlayer]);
        if (parsedMembers.length === 0) {
            await base.db.query(`DELETE FROM clans WHERE "name" = $1`, [clan.name]);
        } else {
            await base.db.query(`UPDATE clans SET "members" = $1 WHERE "name" = $2`, [JSON.stringify(parsedMembers), clan.name]);
        }
        return clan;
    }
}