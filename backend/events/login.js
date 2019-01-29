class loginEvent {}
/**
 * Runs the login Event
 * 
 * @param {Array} args Method arguments
 * @returns {Promise<any>}
 */
loginEvent.run = (...args) => {
    return new Promise(async (resolve, reject) => {
        const [res, io, data, sqlite, bcrypt, sessions, displayError] = args;
        // If username/password is undefined
        if (!res.username || !res.password) return io.to(data.id).emit("login", {
            status: 400,
            message: "Please enter a valid username and password."
        });
        let banned = false;
        await sqlite.prepare("SELECT reason, expires FROM bans WHERE username=?").then(async prepare => {
            return await prepare.get([res.username]).then(result => {
                if (typeof result === "undefined") return;
                if (Date.now() > Number(result.expires)) return sqlite.prepare("DELETE FROM bans WHERE username=?").then(prepared => prepared.run([res.username]));
                banned = true;
                io.to(data.id).emit("login", {
                    status: 403,
                    message: `You have been banned: "${result.reason}". This ban expires at ${new Date(Number(result.expires)).toLocaleString()}`
                });
                return;
            });
        });

        if (banned === false) {
            sqlite.prepare("SELECT * FROM accounts WHERE username = ?").then(prepare => {
                prepare.get([res.username]).then(result => {
                    if (!result) return displayError("Incorrect username or password.", data, "login", 400, io);
                    if (bcrypt.compareSync(res.password, result.password)) {
                        sessions.getSession(sqlite, {
                            type: "username",
                            value: res.username
                        }).then(async session => {
                            if (session) {
                                await sessions.deleteSession(sqlite, {
                                    type: "username",
                                    value: res.username
                                }).catch(() => {});
                            }
                            sessions.registerID(sqlite, res.username).then(id => {
                                io.to(data.id).emit("login", {
                                    status: 200,
                                    message: "Successfully logged in.",
                                    session_id: id
                                });
                                resolve(id);
                            }).catch(error => {
                                displayError(error.toString(), data, "login", 500, io);
                                reject(error);
                            });
                        });
                    } else {
                        displayError("Incorrect username or password.", data, "login", 400, io);
                    }
                });
            }).catch(() => {});
        }
    });
};

module.exports = loginEvent;
