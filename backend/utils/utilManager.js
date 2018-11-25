const {
    readdirSync
} = require("fs");
/**
 * Returns an array as promise of utility methods.
 * 
 * @param {array=} [excluded=utilManager.js] Excluded utils (use filename, e.g. ["displayError.js"])
 * @returns {Promise<array>} An array with objects with properties name (util name, excluding extension) and method (callable)
 */
module.exports = (excluded) => {
    return new Promise((resolve) => {
        resolve(readdirSync("./backend/utils/").filter(_ => _ != "utilManager.js" && !(excluded || []).includes(_)).map(_ => {
            return {
                name: _.substr(0, _.indexOf(".js")),
                method: require(`./${_}`)
            }
        }));
    });
}
