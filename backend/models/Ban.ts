export default class Ban {
    public username: string;
    public reason: string;
    public bannedAt: number;
    public expires: number;
    public moderator: string;

    constructor(data: BanDb) {
        this.username = data.username;
        this.reason = data.reason;
        this.bannedAt = parseInt(data.bannedAt, 10);
        this.expires = parseInt(data.expires, 10);
        this.moderator = data.moderator;
    }
}

export interface BanDb {
    username: string;
    reason: string;
    bannedAt: string;
    expires: string;
    moderator: string;
} 