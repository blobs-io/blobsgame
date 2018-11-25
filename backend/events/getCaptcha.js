class getCaptchaEvent {};
/**
 * Runs the getCaptcha Event
 * 
 * @param {Array} args Method arguments
 * @returns {Promise<array>} The new captchas array
 */
getCaptchaEvent.run = (...args) => {
    const [sessions, io, data, captchas] = args;
    return new Promise(resolve => {
        const captcha = sessions.generateSessionID().substr(0, 6);
        io.to(data.id).emit("captcha", {
            captcha: captcha,
            position: {
                x: Math.floor(Math.random() * 150) + 25,
                y: Math.floor(Math.random() * 65) + 25
            }
        });
        captchas.push({
            captcha: captcha,
            createdAt: Date.now()
        });
        resolve(captchas);
    });
};

module.exports = getCaptchaEvent;
