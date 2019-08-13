export default class AntiCheat {
    public _FLAGS: number;
    constructor(flagValue: number = 0) {
        this._FLAGS = flagValue;
    }

    get flags(): number {
        return this._FLAGS;
    }

    set flags(value) {
        this._FLAGS = value;
    }

    clear(): void {
        this.flags = 0;
    }

    penalize(action: number, value: number) {
        const penalty: number = AntiCheat.penalize(action, value);
        this.flags += penalty;
    }

    static penalize(action: number, value: number) {
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
}