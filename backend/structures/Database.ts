import pg from "pg";
import User, { UserDb } from "../models/User";
import Clan, { ClanData } from "./Clan";
import Promotion, { PromotionDb } from "../models/Promotion";
import VerificationCode from "../models/VerificationCode";
import Ban from "../models/Ban";
import Session from "../models/Session";

export default class Database {
    public driver: pg.Pool;
    constructor(config: any, driver?: pg.Pool) {
        this.driver = driver || new pg.Pool(config);
    }

    /**
     * Executes a query
     * @param query the query
     * @param values an array of values
     * @returns The result
     */
    query(query: string, values?: any[]): Promise<pg.QueryResult> {
        return new Promise((resolve, reject) => {
            this.driver.query(query, values || [], (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });
    }

    async fetchUser(username: string, caseSensitive: boolean = true): Promise<User> {
        const result: pg.QueryResult = await this.query(`SELECT * FROM accounts WHERE ${!caseSensitive ? `upper("username")` : `"username"`} = $1`, [!caseSensitive ? username.toUpperCase() : username]);
        if (result.rowCount < 1) {
            throw new Error("User not found");
        }
        
        return new User(result.rows[0]);
    }
    
    async fetchUsers(limit: number, ordered: boolean = false): Promise<User[]> {
        if (limit > 100) {
            throw new Error("Cannot fetch more than 100 users at a time");
        }

        const result: pg.QueryResult = await this.query(`SELECT * FROM accounts ${ordered ? `ORDER BY "br" DESC` : ""} LIMIT $1`, [limit]);
        return result.rows.map((v: UserDb) => new User(v));
    }

    
    async fetchClan(name: string): Promise<Clan> {
        const result: pg.QueryResult = await this.query(`SELECT * FROM clan WHERE "name" = $1`, [name]);
        if (result.rowCount < 1) {
            throw new Error("Clan not found");
        }

        return new Clan(result.rows[0]);
    }

    async joinClan(clan: string, user: string): Promise<Clan> {
        const dbClan: Clan = await this.fetchClan(clan);
        const dbUser: User = await this.fetchUser(user);

        if (!dbClan) {
            throw new Error("Clan not found");
        }
        if (!dbUser) {
            throw new Error("User not found");
        }

        if (!dbClan.joinable) {
            throw new Error("This clan is not joinable");
        }

        if (dbClan.members.includes(user)) {
            throw new Error("User is already in this clan");
        }

        if (dbClan.members.length >= Clan.MemberLimit) {
            throw new Error("Clan has reached the maximum number of members");
        }

        if (dbUser.clan !== null) {
            throw new Error("User is already in another clan");
        }

        dbClan.members.push(user);
        await Promise.all([
            this.query(`UPDATE accounts SET "clan" = $1 WHERE "username" = $2`, [clan, user]),
            this.query(`UPDATE clans SET "members" = $1 WHERE "name" = $2`, [JSON.stringify(dbClan.members), clan])
        ]);

        return dbClan;
    }

    async leaveClan(clan: string, user: string) {
        const dbClan: Clan = await this.fetchClan(clan);
        const dbUser: User = await this.fetchUser(user);

        if (!dbClan) {
            throw new Error("Clan not found");
        }
        if (!dbUser) {
            throw new Error("User not found");
        }

        if (!dbClan.members.includes(user)) {
            throw new Error("User is not in this clan");
        }

        dbClan.members.splice(dbClan.members.indexOf(user), 1);
        if (dbClan.members.length === 0) { // No more users in this clan
            await this.deleteClan(clan);
        } else {
            await this.query(`UPDATE clans SET "members" = $1 WHERE "name" = $2`, [JSON.stringify(dbClan.members), clan]);
        }

        return dbClan;
    }

    async deleteClan(clan: string, updateUserClans?: boolean, forUser?: string): Promise<Clan> {
        const dbClan: Clan = await this.fetchClan(clan);
        if (!dbClan) {
            throw new Error("Clan not found");
        }

        if (forUser !== undefined && dbClan.leader !== forUser) {
            throw new Error("User is not allowed to delete this clan");
        }

        await this.query(`DELETE FROM clans WHERE "name" = $1`, [clan]);

        if (updateUserClans) {
            await this.query(`UPDATE accounts SET "clan" = $1 WHERE clan = $2`, [null, clan]);
        }

        return dbClan;
    }

    async createClan(user: string, data: ClanData): Promise<Clan> {
        const dbUser: User = await this.fetchUser(user);
        const clan: Clan = await this.fetchClan(data.);
        if (!dbUser) {
            throw new Error("User not found");
        }
        /*
        if (!description || typeof description !== "string" || description.length >= 1024) return res.status(400).json({
                message: "Invalid description length"
            });

            const requester: Socket | undefined = this.base.sockets.find((v: Socket) => v.sessionid === session);
            if (!requester) return res.status(400).json({
                message: "Invalid session ID provided"
            });

            const clan: ClanData | undefined = await this.base.db.query("SELECT 1 FROM clans WHERE name = $1", [req.params.name]).then((v: any) => v.rows[0]);
            if (clan) return res.status(400).json({
                message: "Clan already exists"
            });

            const { clan: userClan } = await this.base.db.query(`SELECT "clan" FROM accounts WHERE username = $1`, [requester.username]).then((v: any) => v.rows[0]);
            if (userClan) return res.status(400).json({
                message: "Requested user is already in a clan"
            });

            const newClan: Clan = new Clan({
                cr: 0,
                description,
                joinable: 1,
                leader: requester.username,
                members: JSON.stringify([requester.username]),
                name: req.params.name,
                tag: req.params.name.substr(0, 4)
            });

            await this.base.db.query(`INSERT INTO clans ("name", "leader", "cr", "members", "description", "joinable", "tag") VALUES ($1, $2, 0, $3, $4, 1, $5)`,
                [
                    newClan.name,
                    newClan.leader,
                    JSON.stringify(newClan.members),
                    newClan.description,
                    newClan.tag
                ]
            );
            await this.base.db.query("UPDATE accounts SET clan = $1 WHERE username = $2", [newClan.name, requester.username]);
            res.json(newClan);
        */
        if ()
    }
    
    async fetchClans(limit: number): Promise<Clan[]> {
        if (limit > 100) {
            throw new Error("Cannot fetch more than 100 clans at a time");
        }

        const result: pg.QueryResult = await this.query("SELECT * FROM clans LIMIT $1", [limit]);
        return result.rows.map((v: ClanData) => new Clan(v));
    }
    
    async fetchVerificationCode(code: string): Promise<VerificationCode> {
        const result: pg.QueryResult = await this.query(`SELECT * FROM verifications WHERE "code" = $1`, [code]);
        if (result.rowCount < 1) {
            throw new Error("Verification code not found");
        }

        return new VerificationCode(result.rows[0]);
    }

    async fetchPromotion(username: string): Promise<Promotion> {
        const result: pg.QueryResult = await this.query(`SELECT * FROM promotions WHERE "user" = $1`, [username]);
        if (result.rowCount < 1) {
            throw new Error("Promotion not found");
        }

        return new Promotion(result.rows[0]);
    }

    async fetchPromotions(limit: number): Promise<Promotion[]> {
        if (limit > 100) {
            throw new Error("Cannot fetch more than 100 promotions at a time");
        }

        const result: pg.QueryResult = await this.query("SELECT * FROM recentPromotions LIMIT $1", [limit]);
        return result.rows.map((v: PromotionDb) => new Promotion(v));
    }
    
    async fetchBan(username: string): Promise<Ban> {
        const result: pg.QueryResult = await this.query(`SELECT * FROM bans WHERE "username" = $1`, [username]);
        if (result.rowCount < 1) {
            throw new Error("Ban not found");
        }

        return new Ban(result.rows[0]);
    }
    
    async fetchSession(id: string): Promise<Session> {
        const result: pg.QueryResult = await this.query(`SELECT * FROM sessionids WHERE "sessionid" = $1`, [id]);
        if (result.rowCount < 1) {
            throw new Error("Session not found");
        }

        return new Session(result.rows[0]);
    }
}