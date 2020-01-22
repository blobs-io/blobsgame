export default class VerificationCode {
    public user: string;
    public code: string;
    public requestedAt: number;

    constructor(data: VerificationCodeDb) {
        this.user = data.user;
        this.code = data.code;
        this.requestedAt = parseInt(data.requestedAt, 10);
    }
}

export interface VerificationCodeDb {
    user: string;
    code: string;
    requestedAt: string;
}