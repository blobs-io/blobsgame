import { randomBytes } from "crypto";
import Database from "./Database";

interface ParamData {
    type: string;
    value: string;
}


/**
 * Generates an n-chars long session ID (using crypto)
 *
 * @param {number} length The length of session id
 * @returns {string=} The generated session ID
 */
export function generateSessionID(length: number): string {
    let session = "";
    for (let i: number = 0; i < length; ++i)
        session += (randomBytes(1).readUInt8(0) & 0xFF).toString(36);
    return session;
}

/**
 * Registers a session ID
 *
 * @param {object} database The database object (must have a run method - recommended sql client: sqlite)
 * @param {string} username The username (does not need to be escaped)
 * @param {string=} session The session id (recommended length: 16)
 * @param {object=|number=} expires Either a timestamp or a date object when the session id expires (default: 15 minutes)
 * @returns {promise<string|object>} The registered session id or an object with error information
 */
export function registerID(database: Database, username: string, session?: string, expires?: Date|number): Promise<string> {
    return new Promise((resolve, reject) => {
        if (typeof session === "undefined")
            session = generateSessionID(8);
        if (typeof expires === "undefined")
            expires = Date.now() + 9e5;

        database.query("INSERT INTO sessionids VALUES ($1, $2, $3)", [username, session, expires])
            .then(() => resolve(session))
            .catch(reject);
    });
}

/**
 * Checks if a session ID exists
 *
 * @param {object} database The database object (must have a run method - recommended sql client: sqlite)
 * @param {object} data An object with both a type property (search keyword, either: session, username or expiresAt) and a value property
 * @returns {promise<boolean|object>} Whether the session ID exists or not (or an object with error information)
 */
export function exists(database: Database, data: ParamData): Promise<boolean> {
    return new Promise((resolve, reject) => {
        let type: string;
        if (data.type === "session") {
            type = "sessionid";
        } else if (data.type === "username") {
            type = "username";
        } else {
            type = "expires";
        }

        database.query(`SELECT * FROM sessionids WHERE "${type}" = $1`, [data.value])
            .then((v: any) => v ? resolve(true) : resolve(false))
            .catch(reject);
    });
}

/**
 * Gets the session object by keyword
 *
 * @param {object} database The database object
 * @param {object} data An object with both a type property (search keyword, either: session, username or expiresAt) and a value property
 * @returns {promise<object|string|undefined>} The session object (username, sessionid, expires)
 */
export function getSession(database: Database, data: ParamData) {
    return new Promise((resolve, reject) => {
        let type: string;
        if (data.type === "session") {
            type = "sessionid";
        } else if (data.type === "username") {
            type = "username";
        } else {
            type = "expires";
        }

        database.query(`SELECT * FROM sessionids WHERE "${type}" = $1`, [data.value])
            .then((v: any) => resolve(v.rows[0]))
            .catch(reject);
    });
}

/**
 * Deletes a session id from database
 *
 * @param {object} database The database object
 * @param {string} data An object with both a type property (search keyword, either: session, username or expiresAt) and a value property
 * @returns {promise<string>} The provided value
 */
export function deleteSession(database: Database, data: ParamData) {
    return new Promise((resolve, reject) => {
        let type: string;
        if (data.type === "session") {
            type = "sessionid";
        } else if (data.type === "username") {
            type = "username";
        } else {
            type = "expires";
        }

        database.query(`DELETE FROM sessionids WHERE "${type}" = $1`, [data.value])
            .then(() => resolve(data.value))
            .catch(reject);
    });
}