/**
 * Returns the amount of BR from a specific player
 * 
 * @param {string} username The username to obtain BR from
 * @param {object} sqlite Opened sqlite database
 * @returns {Promise<number>} The amount of BR the user has
 */
module.exports = (username, sqlite) => {
    return new Promise((resolve, reject) => {
        sqlite.prepare("SELECT * FROM accounts WHERE username = ?").then(prepare => {
            prepare.get([username]).then(result => {
                if(!result) reject(`Player with username "${username}" does not exist.`);
                resolve(result.br);
            })
        }).catch(reject);
    });
}
