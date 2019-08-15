import * as ws from "ws";

export default interface Socket {
    username: string;
    br: number;
    role: number;
    guest: boolean;
    sessionid?: string;
}
export interface wsSocket {
    conn: ws;
    id: string;
}