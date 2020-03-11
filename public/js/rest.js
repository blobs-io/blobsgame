class RestClient {
    constructor(key, authType, api) {
        this.api = api || "/api/v1";
        this._key = key;
        this.authType = authType;
    }

    fetchUser(user) {
        return fetch(`${this.api}/users/${user}`, {
            headers: this.computedHeaders
        });
    }

    fetchPromotions() {
        return fetch(`${this.api}/promotions`);
    }

    fetchRooms() {
        return fetch(`${this.api}/rooms`)
    }

    fetchRoom(id) {
        return fetch(`${this.api}/rooms/${id}`);
    }

    fetchPlayers(roomId) {
        return fetch(`${this.api}/rooms/${roomId}/players`);
    }

    switchBlob(newBlob) {
        return fetch(`${this.api}/blobs/switch`, {
            method: "POST",
            headers: this.computedHeaders,
            body: JSON.stringify({ newBlob })
        });
    }

    redeemDailyBonus() {
        return fetch(`${this.api}/daily`, {
            method: "POST",
            headers: this.computedHeaders
        });
    }

    ping() {
        const before = Date.now();
        return fetch(`${this.api}/ping`).then(() => Date.now() - before);
    }

    get key() {
        return this.authType + " " + this._key;
    }

    get computedHeaders() {
        return {
            "Content-Type": "application/json",
            Authorization: this.key
        }
    }

    static extractSessionID() {
        return document.cookie.split(/; */).find(v => v.startsWith("session=")).split("=")[1];
    }
}