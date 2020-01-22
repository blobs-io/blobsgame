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