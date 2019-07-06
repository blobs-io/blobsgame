import RouteInformation from "../structures/Route";
import Base from "../structures/Base";
import { readFile } from "fs";

export default class getDatabase {
    static route: RouteInformation = {
        path: "/db.sqlite"
    };

    static run(req: any, res: any, base: Base): void {
        if (req.query.token !== base.dbToken) {
            res.status(401).json({
                message: "Invalid token"
            });
            return;
        } else {
            readFile(base.dbPath || "./db.sqlite", (error, file) => {
                if (error) return res.status(500).json({
                    message: "An error occured on the server"
                });
                else res.send(file);
            });
        }
    }
}