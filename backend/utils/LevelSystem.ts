export default class LevelSystem {
    static multiplier: number = 0.09;

    static levelToXP(level: number): number {
        return (level / LevelSystem.multiplier) ** 2;
    }

    static xpToLevel(xp: number): number {
        return LevelSystem.multiplier * Math.sqrt(xp);
    }

    static hasLevelUpped(xpBefore: number, gain: number): boolean {
        return Math.floor(LevelSystem.xpToLevel(xpBefore + gain)) > Math.floor(LevelSystem.xpToLevel(xpBefore));
    }
}