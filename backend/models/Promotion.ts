/*
  await db.run("CREATE TABLE IF NOT EXISTS recentPromotions (" +
            "`user` TEXT, " +
            "`newTier` TEXT, " +
            "`drop` INTEGER, " +
            "`promotedAt` TEXT)");
            */
export default class Promotion {
    public user: string;
    public newTier: string;
    public drop: boolean;
    public promotedAt: number;

    constructor(data: PromotionDb) {
        this.user = data.user;
        this.newTier = data.newTier;
        this.drop = Boolean(data.drop);
        this.promotedAt = parseInt(data.promotedAt, 10);
    }
}

export interface PromotionDb {
    user: string;
    newTier: string;
    drop: number;
    promotedAt: string;
}