// Represents an account
export default class User {
    public username: string;
    public password?: string;
    public createdAt: number;
    public br: number;
    public role: Role;
    public distance: number;
    public coins: number;
    public xp: number;
    public blobs: string[];
    public activeBlob: string;
    public clan: string | null;
    public wins: number;
    public losses: number;

    constructor(data: UserDb) {
        this.username = data.username;
        Object.defineProperty(this, "password", {
            value: data.password,
            enumerable: false // hide property
        });
        this.createdAt = parseInt(data.createdAt, 10);
        this.br = data.br;
        this.role = data.role;
        this.distance = parseInt(data.distance, 10);
        this.coins = data.blobcoins;
        this.blobs = data.blobs.split(new RegExp(", *"));
        this.activeBlob = data.activeBlob;
        this.clan = data.clan;
        this.wins = data.wins;
        this.losses = data.losses;
        this.xp = data.xp;
    }
}

// Data representation of user
export interface UserDb {
    username: string;
    password: string;
    br: number;
    createdAt: string;
    role: number;
    blobcoins: number;
    lastDailyUsage: string;
    distance: string;
    blobs: string;
    activeBlob: string;
    clan: string;
    wins: number;
    losses: number;
    xp: number;
}

export enum Role {
    Guest = -1,
    User = 0,
    Admin = 1
}