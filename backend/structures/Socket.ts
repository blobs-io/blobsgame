// Imports
import * as ws from "ws";

// Represents a socket
export default interface Socket {
    username: string;
    br: number;
    role: number;
    guest: boolean;
    sessionid?: string;
}

// Represents a socket
export interface wsSocket {
    conn: ws;
    id: string;
}