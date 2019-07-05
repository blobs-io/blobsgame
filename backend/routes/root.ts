import RouteInformation from "../structures/Route";
import Base from "../structures/Base";

export default class Root {
    static route: RouteInformation = {
        path: "/"
    };

    static run(req: any, res: any, base: Base): void {

    }
}