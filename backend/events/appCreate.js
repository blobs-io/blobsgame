class appCreateEvent {};
/**
 * Runs the appCreate Event
 * 
 * @param {Array} args Method arguments
 * @returns {Promise<bool>} Whether an OK http code was emitted (200) or a bad one (4xx/5xx)
 */
appCreateEvent.run = (...args) => {
    const [sessionid, displayError, sessions, io, data, sqlite] = args;
    return new Promise(resolve => {
        if (!sessionid) return displayError("No session ID provided.", data, "appCreate", 400, io);
        sessions.getSession(sqlite, {
            type: "session",
            value: sessionid
        }).then(session => {
            if (!session) {
                resolve(false);
                return displayError("Session ID not found", data, "appCreate", 401, io);
            } else {
                resolve(true);
                io.to(data.id).emit("appCreate", {
                    status: 200,
                    username: session.username,
                    expiresAt: session.expires
                });
            }
        });
    });
};

module.exports = appCreateEvent;
