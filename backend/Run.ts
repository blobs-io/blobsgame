import * as Base from "./structures/Base";
import { blueBright, redBright } from "chalk";
import { execSync } from "child_process";

(async () => {
    const hash: string = execSync("git rev-parse HEAD", { encoding: "utf8" });
    console.log(blueBright(`Running hash ${hash.slice(0, -1)}`));
    try {
        const base: Base.default = new Base.default({
            useLoadbalancer: true
        });
        await base.run();
        console.log(blueBright(`Webserver/Websocket Server running on port ${(<Base.Server>base.server).port}`));

        setTimeout(() => {
            if (base.db) {
                //base.db.fetchUser("y21").then(console.log);
                //base.db.fetchClans(10).then(console.log);
                //base.db.fetchVerificationCode("v6g35c5w22674u50d15v6p3o31g").then(console.log);
                base.db.fetchSession("1b941734e12371").then(console.log);
            }
        }, 2500);
    } catch(e) {
        console.log(redBright("An error occurred!"), e);
    }
})();