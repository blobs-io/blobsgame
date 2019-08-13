export default interface Socket {
    username: string;
    br: number;
    role: number;
    guest: boolean;
    sessionid?: string;
}