import WebSocket from "ws";

export default class Loadbalancer {
    public host: string;
    public accessToken: string;
    public interval?: number;
    public gateway?: WebSocket;
    public _interval?: number;
    public static OpcodeHello: number = 10;

    constructor(accessToken: string, host: string) {
        this.host = host;
        this.accessToken = accessToken;
    }

    emitStats(): void {
        if (!this.gateway || this.gateway.readyState !== WebSocket.OPEN)
            throw new Error("Gateway connection not open");
        this.gateway.send(JSON.stringify({
            t: "stats",
            d: JSON.stringify({
                accessToken: this.accessToken,
                // todo...
                mem: 0,
                cpu: 0
            })
        }));
    }

    connect(customHost?: string): WebSocket {
        this.gateway = new WebSocket(customHost || this.host);

        this.gateway.on("message", data => {
            const parsed: any = JSON.parse(data.toString());
            if (parsed.op === Loadbalancer.OpcodeHello) {
                this.interval = parseInt(parsed.d);
                this._interval = <any>setInterval(() => this.emitStats(), this.interval);
            }
        });

        this.gateway.on("close", () => {
            clearInterval(this._interval);
        });

        return this.gateway;
    }
}