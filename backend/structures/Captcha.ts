// Represents a captcha that is requested when registereing
export default interface Captcha {
    // A unique identifier for this captcha
    id: string;
    // A random string that the end-user submits when registering
    captcha: string;
    // A timestamp of when this captcha was generated
    generatedAt: number;
}
// A limit of how many captchas can be requested at once
export const CAPTCHA_LIMIT: number = 100;