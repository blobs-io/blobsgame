const express = require("express");
const app = express();
const socket = require("socket.io");
const server = app.listen(process.env.PORT, () => {
    console.log("App started");
});
const bcrypt = require("bcrypt");
const sqlite = require("sqlite");
const { existsSync, writeFileSync } = require("fs");
app.use(express.static("public"));
if(!existsSync("./db.sqlite")) writeFileSync("", "db.sqlite");
sqlite.open("db.sqlite").then(()=>{
  sqlite.all("SELECT * FROM accounts").then(console.log);
});
const io = socket(server);

function displayError(msg, data, event, status){
  io.to(data.id).emit(event, {
    status: status,
    message: msg
  });
}



io.on("connection", data => {
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
      
        if(/[^\w ]+/.test(res.username)) return displayError("Username should only contain A-Za-z_ ", data, "register", 400);
      
        let hash = bcrypt.hashSync(res.password, 10);
        
       sqlite.prepare("SELECT * FROM accounts WHERE username = ?").then(prepare => {
         prepare.get([ res.username ]).then(result => {
           if(result) return displayError("Username is already taken.", data, "register", 400);
           sqlite.prepare("INSERT INTO accounts VALUES (?, ?, 0)").then(prepare2 => {
             prepare2.run([ res.username, hash ]).then(() => {
               io.to(data.id).emit("register", {
                 status: 200,
                 message: "Account successfully created!"
               });
             }).catch(console.log);
           }).catch(console.log);
         });
       }).catch(err => {
         if(err.toString().includes("no such table: accounts")) {
           displayError("A problem occured on the server-side.", data, "register", 500);
           sqlite.run("CREATE TABLE accounts (`username` TEXT, `password` TEXT, `br` INTEGER)").catch(console.log);
         }
       });
        
    });
});
