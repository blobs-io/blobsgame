import Base from "./Base";

// Clan structure in database
export interface ClanData {
    name: string;
    leader: string;
    cr: number;
    members: string;
    description: string;
    joinable: number;
    tag: string;
}

// Used to represent a clan
export default class Clan {
    // The name of this clan
    public name: string;
    // The leader of this clan
    public leader: string;
    // The rating of this clan (signed)
    public cr: number;
    // Raw string of all members (split by , to get an array)
    public members: Array<string>;
    // The clan description
    public description: string;
    // Whether this clan is joinable or not
    public joinable: boolean;
    // The tag of this clan (1-4 characteres)
    public tag: string;
    // Maximum number of members a clan can have
    public static MemberLimit: number = 20;

    constructor(data: ClanData) {
        this.cr = data.cr;
        this.description = data.description;
        this.joinable = typeof data.joinable === "number" ? Boolean(data.joinable) : data.joinable;
        this.leader = data.leader;
        this.members = JSON.parse(data.members);
        this.name = data.name;
        this.tag = data.tag;
    }

    public static async delete(data: ClanData | string, base: Base): Promise<Array<any> | undefined> {
        if (!base.db) return;
        const target: string = typeof data !== "string" ? data.name : data;
        return Promise.all([
            base.db.query(`DELETE FROM clans WHERE "name" = $1`, [target]),
            base.db.query(`UPDATE accounts SET "clan" = $1 WHERE "clan" = $2`, [null, target])
        ]);
    }
}