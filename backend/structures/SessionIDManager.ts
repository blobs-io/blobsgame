import { randomBytes } from "crypto";

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
export function registerID(database: any, username: string, session?: string, expires?: Date|number): Promise<string> {
    return new Promise((resolve, reject) => {
        if (typeof session === "undefined")
            session = generateSessionID(8);
        if (typeof expires === "undefined")
            expires = Date.now() + 9e5;
        database.prepare("INSERT INTO sessionids VALUES (?, ?, ?)").then((prepare: any) => {
            prepare.run([username, session, expires]).then((result: any) => {
                resolve(session);
            }).catch(reject);
        }).catch(console.log);
    });
}

/**
 * Checks if a session ID exists
 *
 * @param {object} database The database object (must have a run method - recommended sql client: sqlite)
 * @param {object} data An object with both a type property (search keyword, either: session, username or expiresAt) and a value property
 * @returns {promise<boolean|object>} Whether the session ID exists or not (or an object with error information)
 */
export function exists(database: any, data: ParamData): Promise<boolean> {
    return new Promise((resolve, reject) => {
        switch (data.type) {
            case "session":
                database.prepare("SELECT * FROM sessionids WHERE sessionid = ?").then((prepare: any) => {
                    prepare.get([data.value]).then((result: any) => {
                        if (typeof result === "undefined") resolve(false);
                        else resolve(true);
                    });
                }).catch(reject);
                break;
            case "username":
                database.prepare("SELECT * FROM sessionids WHERE username = ?").then((prepare: any) => {
                    prepare.get([data.value]).then((result: any) => {
                        if (typeof result === "undefined") resolve(false);
                        else resolve(true);
                    });
                }).catch(reject);
                break;
            case "expiresAt":
                database.prepare("SELECT * FROM sessionids WHERE expires = ?").then((prepare: any) => {
                    prepare.get([data.value]).then((result: any) => {
                        if (typeof result === "undefined") resolve(false);
                        else resolve(true);
                    });
                }).catch(reject);
                break;
        }
    });
}

/**
 * Gets the session object by keyword
 *
 * @param {object} database The database object
 * @param {object} data An object with both a type property (search keyword, either: session, username or expiresAt) and a value property
 * @returns {promise<object|string|undefined>} The session object (username, sessionid, expires)
 */
export function getSession(database: any, data: ParamData) {
    return new Promise((resolve, reject) => {
        try {
            switch (data.type) {
                case "session":
                    database.prepare("SELECT * FROM sessionids WHERE sessionid = ?").then((prepare: any) => {
                        prepare.get([data.value]).then(resolve).catch(reject);
                    }).catch(reject);
                    break;
                case "username":
                    database.prepare("SELECT * FROM sessionids WHERE username = ?").then((prepare: any) => {
                        prepare.get([data.value]).then(resolve).catch(reject);
                    }).catch(reject);
                    break;
                case "expiresAt":
                    database.prepare("SELECT * FROM sessionids WHERE expires = ?").then((prepare: any) => {
                        prepare.get([data.value]).then(resolve).catch(reject);
                    }).catch(reject);
                    break;
                default:
                    reject("data.type must be either session, username or expiresAt but provided was " + data.type);
            }
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Deletes a session id from database
 *
 * @param {object} database The database object
 * @param {string} data An object with both a type property (search keyword, either: session, username or expiresAt) and a value property
 * @returns {promise<string>} The provided value
 */
export function deleteSession(database: any, data: ParamData) {
    return new Promise((resolve, reject) => {
        try {
            switch (data.type) {
                case "session":
                    database.prepare("DELETE FROM sessionids WHERE sessionid = ?").then((prepare: any) => {
                        prepare.run([data.value]).then(() => resolve(data.value)).catch(reject);
                    }).catch(reject);
                    break;
                case "username":
                    database.prepare("DELETE FROM sessionids WHERE username = ?").then((prepare: any) => {
                        prepare.run([data.value]).then(() => resolve(data.value)).catch(reject);
                    }).catch(reject);
                    break;
                case "expiresAt":
                    database.prepare("DELETE FROM sessionids WHERE expires = ?").then((prepare: any) => {
                        prepare.run([data.value]).then(() => resolve(data.value)).catch(reject);
                    }).catch(reject);
                    break;
            }
        } catch (e) {
            reject(e);
        }
    });
}