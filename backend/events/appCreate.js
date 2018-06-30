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
                    require("../utils/getBRFromPlayer")(session.username, sqlite).then(playerBR => {
                        io.to(data.id).emit("appCreate", {
                            status: 200,
                            username: session.username,
                            br: playerBR,
                            expiresAt: session.expires
                        });
                        sessions.deleteSession(sqlite, {
                            type: "session",
                            value: sessionid
                        }).catch(reject);
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