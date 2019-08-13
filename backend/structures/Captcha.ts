export default interface Captcha {
    id: string;
    captcha: string;
    generatedAt: number;
}
export const CAPTCHA_LIMIT: number = 100;