import RouteInformation from "../structures/Route";
import Base from "../structures/Base";
import { readFile } from "fs";

export default class getDatabase {
    static route: RouteInformation = {
        path: "/testroute"
    };

    static run(req: any, res: any, base: Base): void {
        res.send(`
            <html>
                <head>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script>
                </head>
                <script>
                    const socket = io.connect("http://127.0.0.1:3000");                
                </script>
            </html>
        `);
    }
}