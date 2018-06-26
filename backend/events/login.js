class loginEvent {};
/**
 * Runs the login Event
 * 
 * @param {Array} args Method arguments
 * @returns {undefined}
 */
loginEvent.run = (...args) => {
    const [res, io, data, sqlite, bcrypt, sessions, displayError] = args;
    // If username/password is undefined
    if (!res.username || !res.password) return io.to(data.id).emit("login", {
        status: 400,
        message: "Either username or password is undefined."
    });
    sqlite.prepare("SELECT * FROM accounts WHERE username = ?").then(prepare => {
        prepare.get([res.username]).then(result => {
            if (!result) return displayError("Incorrect username or password.", data, "login", 400);
            if (bcrypt.compareSync(res.password, result.password)) {
                sessions.getSession(sqlite, {
                    type: "username",
                    value: res.username
                }).then(session => {
                    if (session) {
                        sessions.deleteSession(sqlite, {
                            type: "username",
                            value: res.username
                        }).catch(console.log);
                    }
                    sessions.registerID(sqlite, res.username).then(id => {
                        io.to(data.id).emit("login", {
                            status: 200,
                            message: "Successfully logged in.",
                            session_id: id
                        })
                    }).catch(error => {
                        displayError(error.toString(), data, "login", 500)
                    });
                });
            } else {
                displayError("Incorrect username or password.", data, "login", 400);
            }
        });
    }).catch(err => {
        console.log(err)
        if (err.toString().includes("no such table: accounts")) {
            displayError("A problem occured on the server-side.", data, "register", 500);
            sqlite.run("CREATE TABLE accounts (`username` TEXT, `password` TEXT, `br` INTEGER)").catch(console.log);
        }
    });
};

module.exports = loginEvent;
