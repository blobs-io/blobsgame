const { readdirSync } = require("fs");
class switchBlob { };

switchBlob.run = async (data, io, sockets, sqlite, blob) => {
	const targetSocket = sockets.find(v => v.socketid === data.id);
	const files = readdirSync("./public/assets/").filter(v => /\.\w{1,5}$/.test(v) && !v.endsWith(".md")).map(v => v.substr(0, v.search(/\.\w{1,4}$/)));
	if (!files.includes(blob)) return io.to(data.id).emit("alert", {
		type: "error",
		message: "Invalid blob."
	});
	if (typeof targetSocket === "undefined") return;
	const prepare = await sqlite.prepare("UPDATE accounts SET activeBlob=? WHERE username=?");
	await prepare.run([blob, targetSocket.username]);
	io.to(data.id).emit("alert", { type: "success", message: "Blob has been changed to " + blob + "." });
	io.to(data.id).emit("blobChange", blob);
};

module.exports = switchBlob;
