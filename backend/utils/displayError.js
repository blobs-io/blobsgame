/**
 * Displays an error by emitting to websocket on clientside.
 * Note: This should not be called manually. Initalize the utilManager (call ~/backend/utils/utilManager.js) and call val.method(...args)
 * 
 * @param {string} msg The error message
 * @param {Object} data The data object (socket)
 * @param {string} event The event that should get emitted
 * @param {number} status HTTP status code (200 OK, 4xx Client, 5xx Server)
 * @return {undefined}
 */
module.exports = (msg, data, event, status, io) => {
    io.to(data.id).emit(event, {
        status,
        message: msg
    });
}
