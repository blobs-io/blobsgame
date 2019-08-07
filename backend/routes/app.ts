import RouteInformation from "../structures/Route";
import Base from "../structures/Base";
import { readFile } from "fs";
import * as bcrypt from "bcrypt";
import * as SessionIDManager from "../structures/SessionIDManager";

export default class AppRoute {
    static route: RouteInformation = {
        path: "/app"
    };

    static async run(req: any, res: any, base: Base): Promise<void> {
        const { session } = req.cookies;
        if (!session)
            return res.send("<script>document.location.href='/login';</script>");

        const dbSession: any = await SessionIDManager.getSession(base.db, {
            type: "session",
            value: session
        });
        const user: any = await base.db.get("SELECT * FROM accounts WHERE username = ?", dbSession.username);
        const promotions: any = await base.db.all("SELECT * FROM recentPromotions ORDER BY promotedAt DESC LIMIT 10");

        if (req.query.old)
            readFile("./public/app/index.html", "utf8", (error: any, data: string) => {
                res.send(data);
            });
        else
            readFile("./public/app/index2.html", "utf8", (error: any, data: string) => {
                res.send(
                    data
                        .replace(/\[!BLOBRATING]/g, user.br)
                        .replace(/\[!BLOBCOINS]/g, user.blobcoins)
                        .replace(/\[!DISTANCE]/g, user.distance)
                        .replace(/\[!ACTIVEBLOB]/g, user.activeBlob)
                        .replace(/\[!USERBLOBS]/g, user.blobs)
                        .replace(/\[!PROMOTIONS]/g, JSON.stringify(promotions))
                );
            });
    }
}