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
    } catch(e) {
        console.log(redBright("An error occurred!"), e);
    }
})();