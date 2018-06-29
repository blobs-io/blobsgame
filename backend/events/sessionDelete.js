class sessionDeleteEvent {};
/**
 * Runs the sessionDelete Event
 * 
 * @param {Array} args Method arguments
 * @returns {undefined}
 */
sessionDeleteEvent.run = (...args) => {
    const [session, sessions, db, io, data] = args;
    sessions.deleteSession(db, {
        type: "session",
        value: session
    }).then(() => {
        io.to(data.id).emit("sessionDelete");
    }).catch(console.log);
}

module.exports = sessionDeleteEvent;