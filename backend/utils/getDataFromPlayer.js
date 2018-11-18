module.exports = (username, sqlite) => {
    return new Promise((resolve, reject) => {
        sqlite.prepare("SELECT * FROM accounts WHERE username = ?").then(prepare => {
            prepare.get([username]).then(result => {
                if(!result) reject(`Player with username "${username}" does not exist.`);
                resolve(result);
            })
        }).catch(reject);
    });
}
