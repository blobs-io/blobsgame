export enum ItemType {
    // Health item; fills up health points
    HEALTH = 0,
    // Adds blobcoin(s) to the user
    COIN   = 1
}

export interface Item {
    // x coordinate of this item
    x: number;
    // y coordinate of this item
    y: number;
    // Type of this item
    type: ItemType;
    // Unique identifier for this item
    id: string;
}