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
		console.log("test");
	});
});
