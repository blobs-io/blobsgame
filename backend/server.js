const express = require("express");
const app = express();
const socket = require("socket.io");
const server = app.listen(process.env.PORT, () => {
	console.log("App started");
});
app.use(express.static("public"));

const io = socket(server);

io.on("connection", data => {
	data.on("register", res => {
		
		// If username/password is undefined
		if(!res.username || !res.password) return io.to(data.id).emit("register", {
			status: 400,
			message: "Either username or password is undefined."
		});
		
		// Username/Password length check
		if(res.username.length < 3 || res.username.length > 10) return io.to(data.id).emit("register", {
			status: 400,
			message: "Username needs to be at least 3 characters long and must not be longer than 10 characters."
		});
		
		if(res.password.length < 5 || res.password.length > 32) return io.to(data.id).emit("register", {
			status: 400,
			message: "Password needs to be at least 5 characters long and must not be longer than 32 characters."
		});
	});
});
