import RouteInformation from "../structures/Route";
import Base from "../structures/Base";
import { readFile } from "fs";

export default class Root {
    static route: RouteInformation = {
        path: "/"
    };

    static run(req: any, res: any, base: Base): void {
        readFile("./public/index.html", "utf8", (e, r) => {
            if (e) return res.status(500).json({
                message: "An error occurred on the server (could not read file)"
            });

            res.send(r);
        });
    }
}