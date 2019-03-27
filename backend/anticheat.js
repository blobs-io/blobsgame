module.exports = class AntiCheat {
    constructor(flagValue = 0) {
        this._FLAGS = flagValue;
    }

    get flags() {
        return this._FLAGS;
    }
    set flags(value) {
        return this._FLAGS = value;
    }

    clear() {
        this.flags = 0;
    }

    penalize(...args) {
        const penalty = this.constructor.penalize(...args);
        this.flags += penalty;
    }

    static penalize(action, value) {
        let penalty = 0;
        if (action === 1) {
            if (value > 10 && value < 20) penalty += 0x1;
            else if (value < 30) penalty += 0x2;
            else if (value < 40) penalty += 0x4;
            else if (value < 50) penalty += 0x8;
            else if (value < 75) penalty += 0x10;
            else penalty += 0x20;
        }
        return penalty;
    }
};