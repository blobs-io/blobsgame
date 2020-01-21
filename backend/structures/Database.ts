import pg from "pg";

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
    query(query: string, values?: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.driver.query(query, values || [], (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });
    }
}