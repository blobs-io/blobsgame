export default class Clan {
    public leader: string;
    public cr: number;
    public members: string;
    public description: string;

    constructor(leader: string, cr: number, members: string, description: string) {
        this.leader = leader;
        this.cr = cr;
        this.members = members;
        this.description = description;
    }
}