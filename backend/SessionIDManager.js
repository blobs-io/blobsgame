const { randomBytes } = require("crypto");
/**
 * 
 * @param {object} database The database object (must have a run method - recommended sql client: sqlite)
 * @param {string} username The username
 * @param {string=} session The session id (recommended length: 16)
 * @param {object=|number=} expires Either a timestamp or a date object when the session id expires (default: 15 minutes)
 * @returns {promise<string>} The registered session id
 */
exports.registerID = (database, username, session, expires) => {
    // Assign random value to session if undefined
    if(typeof session === "undefined") {
        session = "";
        for(let i = 0; i < 8; ++i){
            session += (crypto.randomBytes(1).readUInt8() & 0xFF).toString(36);
        }
    }
    if(typeof expired === "undefined") expired = Date.now() + 9e5;
    if(!(expires instanceof Date) && typeof(expires) !== "number") throw new ReferenceError("Fourth parameter (expires) has to be either a number or a date object.");
}
