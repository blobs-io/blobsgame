const rest = new RestClient(RestClient.extractSessionID(), "Session");
document.getElementById("play-btn").addEventListener("click", showOverview.bind(null, false, rest));

document.addEventListener('DOMContentLoaded', () => {
    M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'), {
        hover: true
    });
});

document.getElementById("logout").addEventListener("click", () => {
    document.cookie = "session=null;expires=" + new Date(Date.now() - 1).toUTCString() + ";path=/";
    document.location.href = "/";
});


void (async function() {

    const stats = await rest.fetchUser("@me").then(v => v.json());
    stats.level = Math.floor(xpToLevel(stats.xp));

    const promotions = []; // await rest.fetchPromotions().then(v => v.json());

    document.getElementById("br").innerHTML = `${stats.br} BR (${getTier(stats.br).tier})`;
    document.getElementById("blobcoins").innerHTML = `${stats.blobcoins} Blobcoins`;
    document.getElementById("distance").innerHTML = `Distance travelled: ${parseDistance(stats.distance)} pixels`;
    document.getElementById("level").innerHTML = `Lv. ${stats.level} (${Math.floor(stats.xp / (((stats.level+1) / 0.09) ** 2) * 100) + "%"})`;
    for (const blob of stats.blobs.split(",")) {
        // TODO: This doesn't work yet
        const blobElement = document.createElement("div");
        blobElement.className = "card bloblist-entry";
        blobElement.innerHTML = `
                <div class="card-content">
                    <img src="/assets/${blob}.png" width="70" height="70" />
                </div>
                <div class="card-action">
                    <a id="choose-${blob}">Choose</a>
                </div>
            `;
        document.getElementById("blobs").appendChild(blobElement);
        document.getElementById(`choose-${blob}`).addEventListener("click", async () => {
            const req = await rest.switchBlob(blob);
            if (req.status === 200) {
                alert("Successfully switched blob");
            } else {
                const message = await req.json();
                console.log(message);
            }
        });
    }

    for (const promotion of promotions) {
        const promotionElement = document.createElement("span");
        promotionElement.className = "promotion";
        promotionElement.innerHTML = `
                <span class="small material-icons">${promotion.drop === 0 ? "expand_less" : "expand_more"}</span> ${promotion.user} (${promotion.newTier})
            `;

        document.getElementById("promotions")
            .appendChild(promotionElement)
            .appendChild(document.createElement("br"));
    }

    document.getElementById("daily-bonus").addEventListener("click", async () => {
        const req = await rest.redeemDailyBonus();
        const parsed = await req.json();
        if (req.status === 200) {
            document.getElementById("blobcoins").innerHTML = `${stats.blobcoins += parsed.bonus} Blobcoins`;
        } else {
            alert(parsed.message);
        }
    });
})();