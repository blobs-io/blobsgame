module.exports = class Ping {
    static async run(...data) {
        const [req, res] = data;
        const arrived = Date.now();
        res.send({ arrived });
    }

    static get info() {
        return {
            path: "ping"
        }
    }
};
