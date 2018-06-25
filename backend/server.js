const express = require("express");
const app = express();
const socket = require("socket.io");
const server = app.listen(process.env.PORT, () => {
    console.log("App started");
});
const bcrypt = require("bcrypt");
const sqlite = require("sqlite");
const {
    existsSync,
    writeFileSync
} = require("fs");
app.use(express.static("public"));
if (!existsSync("./db.sqlite")) writeFileSync("./db.sqlite", "");
const io = socket(server);
sqlite.open("db.sqlite");
const sessions = require("./SessionIDManager");
const captchas = new Map();

/**
 * Displays an error by emitting to websocket on clientside
 * 
 * @param {string} msg The error message
 * @param {Object} data The data object (socket)
 * @param {string} event The event that should get emitted
 * @param {number} status HTTP status code (200 OK, 4xx Client, 5xx Server)
 * @return {undefined}
 */
function displayError(msg, data, event, status) {
    io.to(data.id).emit(event, {
        status: status,
        message: msg
    });
}



io.on("connection", data => {
    data.on("getCaptcha", () => {
        const captcha = sessions.generateSessionID().substr(0, 6);
        io.to(data.id).emit("captcha", {
            captcha: captcha,
            position: {
                x: Math.floor(Math.random() * 150) + 25,
                y: Math.floor(Math.random() * 65) + 25
            }
        });
        captchas.set(data.id, captcha);
    });

    data.on("login", res => {
        // If username/password is undefined
        if (!res.username || !res.password) return io.to(data.id).emit("login", {
            status: 400,
            message: "Either username or password is undefined."
        });
        sqlite.prepare("SELECT * FROM accounts WHERE username = ?").then(prepare => {
            prepare.get([res.username]).then(result => {
                if(bcrypt.compareSync(res.password, result.password)){
                    io.to(data.id).emit("login", {
                        status: 200,
                        message: "Successfully logged in."
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
    });

    data.on("register", res => {
        // If username/password is undefined
        if (!res.username || !res.password) return io.to(data.id).emit("register", {
            status: 400,
            message: "Either username or password is undefined."
        });

        // Username/Password length check
        if (res.username.length < 3 || res.username.length > 10) return io.to(data.id).emit("register", {
            status: 400,
            message: "Username needs to be at least 3 characters long and must not be longer than 10 characters."
        });

        if (res.password.length < 5 || res.password.length > 32) return io.to(data.id).emit("register", {
            status: 400,
            message: "Password needs to be at least 5 characters long and must not be longer than 32 characters."
        });

        if (/[^\w ]+/.test(res.username)) return displayError("Username should only contain A-Za-z_ ", data, "register", 400);

        if(res.captcha !== captchas.get(data.id)) return displayError("Captcha is not correct", data, "register", 400);

        const hash = bcrypt.hashSync(res.password, 10);

        sqlite.prepare("SELECT * FROM accounts WHERE username = ?").then(prepare => {
            prepare.get([res.username]).then(result => {
                if (result) return displayError("Username is already taken.", data, "register", 400);
                sqlite.prepare("INSERT INTO accounts VALUES (?, ?, 0)").then(prepare2 => {
                    prepare2.run([res.username, hash]).then(() => {
                        io.to(data.id).emit("register", {
                            status: 200,
                            message: "Account successfully created!"
                        });
                    }).catch(console.log);
                }).catch(console.log);
            });
        }).catch(err => {
            if (err.toString().includes("no such table: accounts")) {
                displayError("A problem occured on the server-side.", data, "register", 500);
                sqlite.run("CREATE TABLE accounts (`username` TEXT, `password` TEXT, `br` INTEGER)").catch(console.log);
            }
        });

    });
});
