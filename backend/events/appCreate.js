const { rooms } = require("../Base");
class appCreateEvent {};
/**
 * Runs the appCreate Event
 * 
 * @param {Array} args Method arguments
 * @returns {Promise<bool>} Whether an OK http code was emitted (200) or a bad one (4xx/5xx)
 */
appCreateEvent.run = (...args) => {
    const [sessionid, displayError, sessions, io, data, sqlite, sockets] = args;
    return new Promise((resolve, reject) => {
		sqlite.all("SELECT promotedAt FROM recentPromotions ORDER BY promotedAt ASC").then(res => {
			for (let i = 0; i < res.length; ++i) {
				if (Date.now() - parseInt(res[i].promotedAt) >= 86400000) {
					sqlite.run(`DELETE FROM recentPromotions WHERE promotedAt="${res[i].promotedAt}"`);
				}
			}
		});
        if (!sessionid) return displayError("No session ID provided.", data, "appCreate", 400, io);
        sessions.getSession(sqlite, {
            type: "session",
            value: sessionid
        }).then(session => {
            if (!session && !sockets.some(_ => _.sessionid === sessionid)) {
                resolve(false);
                return displayError("Session ID not found", data, "appCreate", 401, io);
            } else {
                if (Date.now() > (session || Date.now() + 10000).expires) {
                    sessions.deleteSession(sqlite, {
                        type: "session",
                        value: sessionid
                    }).then(() => {
                        displayError("Session expired", data, "appCreate", 403, io);
                    }).catch(console.log);
                }
                if(session) {
                    require("../utils/getDataFromPlayer")(session.username, sqlite).then(async playerData => {
                        io.to(data.id).emit("appCreate", {
                            status: 200,
                            username: session.username,
                            br: playerData.br,
                            role: playerData.role,
                            online: sockets.map(v => { return {
								location: "Lobby",
								br: v.br,
								username: v.username,
								lastDaily: v.lastDaily,
								role: v.role
							}}).concat(rooms.find(v => v.id === "ffa").players.map(v => { return {
								location: "FFA",
								username: v.owner,
								br: v.br,
								role: 0
							}; })),
                            coins: playerData.blobcoins,
                            distance: playerData.distance,
                            lastDaily: playerData.lastDailyUsage,
                            userBlobs: playerData.blobs.split(","),
                            activeBlob: playerData.activeBlob,
                            news: await sqlite.all("SELECT headline, content FROM news ORDER BY createdAt DESC LIMIT 5"),
                            promotions: await sqlite.all("SELECT * FROM recentPromotions ORDER BY promotedAt DESC LIMIT 10"),
                            expiresAt: session.expires
                        });
                        resolve(true);
                    }).catch(reject);
                } else {
                    return displayError("Session expired", data, "appCreate", 403, io);
                }
            }
        });
    });
};

module.exports = appCreateEvent;
