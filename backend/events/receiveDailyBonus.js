class receiveDailyBonus { };

receiveDailyBonus.run = async (data, io, sockets, sqlite) => {
	const targetSocket = sockets.find(v => v.socketid === data.id);
	const userData = await require("../utils/getDataFromPlayer")(targetSocket.username, sqlite);
	if (typeof targetSocket === "undefined") return;
	if (Date.now() - userData.lastDailyUsage <= 86400000) return io.to(data.id).emit("alert", {
			type: "error",
			message: "Please wait " + ((86400000 - (Date.now() - userData.lastDailyUsage)) / 1000 / 60 / 60).toFixed(2) + " more hours."
	});
	const prepared = await sqlite.prepare("UPDATE accounts SET lastDailyUsage = '" + Date.now() + "', blobcoins = blobcoins + 20 WHERE username=?");
	await prepared.run([targetSocket.username]);
	io.to(data.id).emit("alert", {
		type: "success",
		message: "Successfully received daily bonus. "
	});
	io.to(data.id).emit("dailyBonus");
};


module.exports = receiveDailyBonus;
