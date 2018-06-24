const {
    randomBytes
} = require("crypto");
/**
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
                    reject({ toString: () => "Table was not present at execution. It has been created now." });
                } else console.log(error);
            });
        } catch (e) {
            reject(e);
        }
    });
}
