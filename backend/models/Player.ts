// Imports
import Base from "../structures/Base";
import Room from "../structures/Room";
import AntiCheat from "../structures/AntiCheat";
import { wsSocket } from "../structures/Socket";
import * as EliminationRoom from "../structures/EliminationRoom";
import LevelSystem from "../utils/LevelSystem";
import Clan, { ClanData } from "../structures/Clan";
import ClanController from "../clans/ClanController";
import User, { Role } from "./User";

export default class Player {
    public static regeneration = {
        ratelimit: 5,
        health: 5
    };
    public owner: string;
    public br: number;
    public blob: string;
    public role: Role;
    public id: string;
    public lastnom: number;
    public direction: number;
    public directionChangeCoordinates: {
        x?: number;
        y?: number;
    };
    public directionChangedAt: number;
    public guest: boolean;
    public distance: number;
    public room: Room;
    public health: number;
    public anticheat: AntiCheat;
    public x: number;
    public y: number;
    public base: Base;
    public lastRegeneration: number;
    public lastHeartbeat: number;
    public noms: number;
    public user: User;

    constructor() {}
    public get inProtectedArea(): boolean {}
    public regenerate(): void {}
    public saveDistance(customDistance?: number): void {}
    public wsSend(str: string): void {}
}