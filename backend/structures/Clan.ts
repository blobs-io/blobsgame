// Used to represent a clan
export default class Clan {
    // The leader of this clan
    public leader: string;
    // The rating of this clan (signed)
    public cr: number;
    // Raw string of all members (split by , to get an array)
    public members: string;
    // The clan description
    public description: string;

    constructor(leader: string, cr: number, members: string, description: string) {
        // Store local variables
        this.leader = leader;
        this.cr = cr;
        this.members = members;
        this.description = description;
    }
}