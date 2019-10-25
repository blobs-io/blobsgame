// Used for detecting suspicious behavior
export default class AntiCheat {
    // Stores the flags
    // Higher flag value = Higher probability of cheating
    public _FLAGS: number;

    constructor(flagValue: number = 0) {
        // Assign local variable
        this._FLAGS = flagValue;
    }

    // Equivalent to reading property this._FLAGS
    // Just more convenient
    get flags(): number {
        return this._FLAGS;
    }

    // Equivalent to assigning to property this._FLAGS
    // Just more convenient
    set flags(value) {
        this._FLAGS = value;
    }

    // Resets flags to 0
    public clear(): void {
        this.flags = 0;
    }

    // Penalizes user by a calculated amount
    public penalize(action: number, value: number): void {
        const penalty: number = AntiCheat.penalize(action, value);
        this.flags += penalty;
    }

    // Penalizes an action by a calculated number
    // No instance needed for this
    public static penalize(action: number, value: number) {
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