// Imports
import GameMap from "./GameMap";
import Player from "../models/Player";
import {wsSocket} from "./Socket";
import {EventTypes, OPCODE} from "../WSEvents";
import Base from "./Base";
import {Item, ItemType} from "./Item";

// Available room modes
export const Mode: any = {
    FFA: "ffa",
    ELIMINATION: "elimination"
};

// Represents a room
export default class Room extends GameMap {
    // This rooms ID
    public id: string;
    // All players in this room
    public players: Player[];
    // All items in this room
    public items: Item[];
    // This rooms mode
    public mode: string;
    // The timestamp of when this room was created
    public createdAt: number;
    // A reference to a base object
    public base: Base;

    constructor(base: Base, map: any = {}, id: string = Math.random().toString(32).substr(2,6), mode: string = Mode.FFA) {
        // Store local variables
        super(map);
        this.id = id;
        this.mode = mode;
        this.players = [];
        this.createdAt = Date.now();
        this.base = base;
        this.items = [];
    }

    // Calculates the number of milliseconds this room has been up for
    get uptime() {
        return Date.now() - this.createdAt;
    }

    // Executes a callback function on every wsSocket
    broadcast(fn: (ws: wsSocket, player?: Player) => any): void {
        for (let i: number = 0; i < this.players.length; ++i) {
            const socket: wsSocket | undefined = this.base.wsSockets.find((v: wsSocket) => v.id === this.players[i].id);
            if (!socket) continue;
            fn(socket, this.players[i]);
        }
    }

    // Sends a string to every websocket connection
    broadcastSend(str: string): void {
        this.broadcast(ws => ws.conn.send(str));
    }

    // Adds n random items to the map
    addItems(n: number): void {
        for (let i = 0; i < n; ++i) {
            for (const element of Object.keys(ItemType)) {
                const item: Item = {
                    id: element.substr(0, 3) + this.getItemsOfType(ItemType[element]).length,
                    type: ItemType[element],
                    x: Math.random() * this.map.map.mapSize.width,
                    y: Math.random() * this.map.map.mapSize.height
                };
                this.items.push(item);
            }
        }
    }

    // Returns all items of a type
    getItemsOfType(t: number): Array<Item> {
        return this.items.filter(i => i.type === t);
    }
}