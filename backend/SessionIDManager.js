const {
    randomBytes
} = require("crypto");
/**
 * Registers a session ID
 * 
 * @param {object} database The database object (must have a run method - recommended sql client: sqlite)
 * @param {string} username The username (does not need to be escaped)
 * @param {string=} session The session id (recommended length: 16)
 * @param {object=|number=} expires Either a timestamp or a date object when the session id expires (default: 15 minutes)
 * @returns {promise<string|object>} The registered session id or an object with error information
 */
exports.registerID = (database, username, session, expires) => {
    return new Promise((resolve, reject) => {
        try {
            // Assign random value to session if undefined
            if (typeof session === "undefined") {
                session = "";
                for (let i = 0; i < 8; ++i) {
                    session += (randomBytes(1).readUInt8() & 0xFF).toString(36);
                }
            }
            if (typeof expires === "undefined") expires = Date.now() + 9e5;
            if (!(expires instanceof Date) && typeof (expires) !== "number") throw new ReferenceError("Fourth parameter (expires) has to be either a number or a date object.");
            database.prepare("INSERT INTO sessionids VALUES (?, ?, ?)").then(prepare => {
                prepare.run([username, session, expires]).then(result => {
                    resolve(session);
                }).catch(reject);
            }).catch(error => {
                if (error.toString().includes("no such table: sessionids")) {
                    database.run("CREATE TABLE sessionids (`username` TEXT, `sessionid` TEXT, `expires` TEXT)").catch(reject);
                    reject({
                        toString: () => "Table was not present at execution. It has been created now."
                    });
                } else console.log(error);
            });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Checks if a session ID exists
 * 
 * @param {object} database The database object (must have a run method - recommended sql client: sqlite)
 * @param {object} data An object with both a type property (search keyword, either: session, username or expiresAt) and a value property
 * @returns {promise<boolean|object>} Whether the session ID exists or not (or an object with error information)
 */
exports.exists = (database, data) => {
    return new Promise((resolve, reject) => {
        try {
            switch (data.type) {
                case "session":
                    database.prepare("SELECT * FROM sessionids WHERE sessionid = ?").then(prepare => {
                        prepare.get([data.value]).then(result => {
                            if (typeof result === "undefined") resolve(false);
                            else resolve(true);
                        });
                    }).catch(reject);
                    break;
                case "username":
                    database.prepare("SELECT * FROM sessionids WHERE username = ?").then(prepare => {
                        prepare.get([data.value]).then(result => {
                            if (typeof result === "undefined") resolve(false);
                            else resolve(true);
                        });
                    }).catch(reject);
                    break;
                case "expiresAt":
                    database.prepare("SELECT * FROM sessionids WHERE expires = ?").then(prepare => {
                        prepare.get([data.value]).then(result => {
                            if (typeof result === "undefined") resolve(false);
                            else resolve(true);
                        });
                    }).catch(reject);
                    break;
            }
        } catch (e) {
            reject(e)
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
exports.getSession = (database, data) => {
    return new Promise((resolve, reject) => {
        try {
            switch (data.type) {
                case "session":
                    database.prepare("SELECT * FROM sessionids WHERE sessionid = ?").then(prepare => {
                        prepare.get([data.value]).then(resolve).catch(reject);
                    }).catch(reject);
                    break;
                case "username":
                    database.prepare("SELECT * FROM sessionids WHERE username = ?").then(prepare => {
                        prepare.get([data.value]).then(resolve).catch(reject);
                    }).catch(reject);
                case "expiresAt":
                    database.prepare("SELECT * FROM sessionids WHERE expires = ?").then(prepare => {
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
 * Generates a n-chars long session ID (using crypto)
 * 
 * @param {number} length The length of session id
 * @returns {string=} The generated session ID
 */
exports.generateSessionID = length => {
    let session = "";
    for (let i = 0; i < ((parseInt(length) || 16) / 2); ++i) {
        session += (randomBytes(1).readUInt8() & 0xFF).toString(36);
    }
    return session;
}

/**
 * Deletes a session id from database
 * 
 * @param {object} database The database object
 * @param {string} data An object with both a type property (search keyword, either: session, username or expiresAt) and a value property
 * @returns {promise<string>} The provided value
 */
exports.deleteSession = (database, data) => {
    return new Promise((resolve, reject) => {
        try {
            switch (data.type) {
                case "session":
                    database.prepare("DELETE FROM sessionids WHERE sessionid = ?").then(prepare => {
                        prepare.run([data.value]).then(() => resolve(data.value)).catch(reject);
                    }).catch(reject);
                    break;
                case "username":
                    database.prepare("DELETE FROM sessionids WHERE username = ?").then(prepare => {
                        prepare.run([data.value]).then(() => resolve(data.value)).catch(reject);
                    }).catch(reject);
                    break;
                case "expiresAt":
                    database.prepare("DELETE FROM sessionids WHERE expires = ?").then(prepare => {
                        prepare.run([data.value]).then(() => resolve(data.value)).catch(reject);
                    }).catch(reject);
                    break;
            }
        } catch (e) {
            reject(e);
        }
    });
}
