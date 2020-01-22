export default class Session {
    public username: string;
    public sessionid: string;
    public expires: number;

    constructor(data: SessionDb) {
        this.username = data.username;
        this.sessionid = data.sessionid;
        this.expires = parseInt(data.expires, 10);
    }
}

export interface SessionDb {
    username: string;
    sessionid: string;
    expires: string;
}