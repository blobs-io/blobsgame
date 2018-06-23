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
	});
});
