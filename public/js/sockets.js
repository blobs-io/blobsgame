const server = "http://localhost:3000";
const socket = io.connect(server);
const message = "<div id=\"<type>-notif\"><message></div>";

class MenuFunction {
    /**
     * Shows HTMLElements for a specific menu (must be overwritten by child)
     * 
     * @abstract
     */
    run() {
        throw new ReferenceError("run function must be called from child class");
    }

    /**
     * Hides HTMLElements for a specific menu (must be overwritten by child)
     * 
     * @abstract
     */
    hide() {
        throw new ReferenceError("hide function must be called from child class");
    }

    /**
     * Binds events for a specific menu (must be overwritten by child)
     * @returns {undefined}
     */
    bindEvents() {
        throw new ReferenceError("bindEvents function must be called from child class");
    }
};

class MainMenu extends MenuFunction {
    /**
     * The contructor for MainMenu class
     * 
     * @param {object=} elements An object with HTMLElements
     */
    constructor(elements) {
        super();
        if(typeof elements !== "undefined") this._elements = elements;
    }

    get elements() {
        return this._elements;
    }
    
    set elements(value) {
        return this._elements = value;
    }

    /**
     * Shows all HTMLElements for the main menu
     * 
     * @param {object} data The result of appCreate event (emitted by websocket)
     * @returns {Promise<object>} An object with HTMLElements
     */
    run(data) {
        return new Promise(resolve => {
            const elements = {
                authDiv: document.createElement("div"),
                brLabel: document.createElement("span"),
                logoutBtn: document.createElement("span"),
                greeting: document.createElement("h2"),
                // Singleplayer Box
                mmBoxesSP: document.createElement("div"),
                spHeading: document.createElement("h3"),
                blobKittenKnifeIMG: document.createElement("img"),
                // Multiplayer box
                mmBoxesMP: document.createElement("div"),
                mpHeading: document.createElement("h3"),
                blobEvilIMG: document.createElement("img"),
                // Blobs box
                mmBoxesBlobs: document.createElement("div"),
                blobsHeading: document.createElement("h3"),
                blobEyesIMG: document.createElement("img"),
                // Settings box
                mmBoxesSTG: document.createElement("div"),
                stgHeading: document.createElement("h3"),
                blobPeekIMG: document.createElement("img")
            };

            elements.authDiv.id = "auth";
            elements.brLabel.className = "mm-br-label";
            elements.brLabel.innerHTML = `<span id="br">${data.br}</span> BR`;
            elements.logoutBtn.className = "mm-logout-btn";
            elements.logoutBtn.innerHTML = "Log-out";
            elements.greeting.innerHTML = `Welcome back, <span id="username">${data.username}</span>.`;
            elements.mmBoxesSP.className = "mm-box mm-sp-box";
            elements.spHeading.innerHTML = "Singleplayer";
            elements.blobKittenKnifeIMG.src = "../assets/BlobKittenKnife.png";
            elements.blobKittenKnifeIMG.id = "blob";
            elements.mmBoxesMP.className = "mm-box mm-mp-box";
            elements.mpHeading.innerHTML = "Multiplayer";
            elements.blobEvilIMG.src = "../assets/blobevil.png";
            elements.blobEvilIMG.id = "blob";
            elements.mmBoxesBlobs.className = "mm-box mm-blobs-box"
            elements.blobsHeading.innerHTML = "Blobs";
            elements.blobEyesIMG.src = "../assets/blobeyes.png";
            elements.blobEyesIMG.id = "blob";
            elements.mmBoxesSTG.className = "mm-box mm-stg-box";
            elements.stgHeading.innerHTML = "Settings";
            elements.blobPeekIMG.src = "../assets/blobpeek.png";
            elements.blobPeekIMG.id = "blob";
            document.body.appendChild(elements.authDiv);
            elements.authDiv.appendChild(elements.brLabel);
            elements.authDiv.appendChild(elements.logoutBtn);
            elements.authDiv.appendChild(elements.greeting);
            // Appending singleplayer elements
            elements.authDiv.appendChild(elements.mmBoxesSP);
            elements.mmBoxesSP.appendChild(elements.spHeading);
            elements.mmBoxesSP.appendChild(elements.blobKittenKnifeIMG);
            // Appending multiplayer elements
            elements.authDiv.appendChild(elements.mmBoxesMP);
            elements.mmBoxesMP.appendChild(elements.mpHeading);
            elements.mmBoxesMP.appendChild(elements.blobEvilIMG);
            // Appending "blobs" elements
            elements.authDiv.appendChild(elements.mmBoxesBlobs);
            elements.mmBoxesBlobs.appendChild(elements.blobsHeading);
            elements.mmBoxesBlobs.appendChild(elements.blobEyesIMG);
            // Appending "settings" elements
            elements.authDiv.appendChild(elements.mmBoxesSTG);
            elements.mmBoxesSTG.appendChild(elements.stgHeading);
            elements.mmBoxesSTG.appendChild(elements.blobPeekIMG);
            resolve(elements);
        });
    }

    /**
     * Hides HTMLElements.authDiv || this.elements.authDiv
     * 
     * @param {object=} HTMLElements An object with HTMLElements, only required when this.elements is undefined
     * @returns {Promise<object>} The hidden object (auth essentially)
     */
    hide(HTMLElements) {
        return new Promise(resolve => {
            resolve(document.body.removeChild(((this.elements || { authDiv: undefined }).authDiv || HTMLElements).authDiv));
        });
    }
}

class SettingsMenu extends MenuFunction {
    /**
    * The contructor for SettingsMenu class
    * 
    * @param {object=} elements An object with HTMLElements
    */
    constructor() {
        super();
        if(typeof elements !== "undefined") this._elements = elements;
    }

    get elements() {
        return this._elements;
    }
    
    set elements(value) {
        return this._elements = value;
    }

    /**
     * Shows all HTMLElements for the main menu
     * 
     * @param {object} elements An object of HTMLElements (returned by MainMenu#run)
     * @returns {Promise<object>} An object with HTMLElements
     */
    run(elements) {
        return new Promise(resolve => {
            const settingElements = {
                authDiv: document.createElement("div"),
                backBtn: document.createElement("button"),
                heading: document.createElement("h2"),
                deleteBtn: document.createElement("button"),
                resetBtn: document.createElement("button"),
                hrDiv: document.createElement("div"),
                warningDiv: document.createElement("div"),
                passwordFields: [
                    document.createElement("input"),
                    document.createElement("input")
                ],
                brTags: [
                    document.createElement("br"),
                    document.createElement("br")
                ],
                changePwBtn: document.createElement("button")
            };
            settingElements.authDiv.id = "auth-small";
            settingElements.authDiv.align = "center";
            settingElements.backBtn.className = "back-btn";
            settingElements.backBtn.innerHTML = "⇐ Back to menu";
            settingElements.heading.className = "heading";
            settingElements.heading.innerHTML = "Settings";
            settingElements.deleteBtn.className = "delete-btn red-btn";
            settingElements.deleteBtn.innerHTML = "Delete Account";
            settingElements.resetBtn.className = "reset-btn red-btn";
            settingElements.resetBtn.innerHTML = "Reset Progress";
            settingElements.hrDiv.id = "hr";
            settingElements.warningDiv.className = "warning";
            settingElements.warningDiv.innerHTML = "<b>Warning!</b> Make sure not to make a typo when changing your password. There is no way to request a new password as you did not provide an e-mail!";
            settingElements.passwordFields[0].type = "password";
            settingElements.passwordFields[0].placeholder = "Old password";
            settingElements.passwordFields[0].id = "old-pw";
            settingElements.passwordFields[1].type = "password";
            settingElements.passwordFields[1].placeholder = "New password";
            settingElements.passwordFields[1].id = "new-pw";
            settingElements.changePwBtn.className = "change-pw-btn";
            settingElements.changePwBtn.innerHTML = "Change password";


            settingElements.authDiv.appendChild(settingElements.backBtn);
            settingElements.authDiv.appendChild(settingElements.heading);
            settingElements.authDiv.appendChild(settingElements.deleteBtn);
            settingElements.authDiv.appendChild(settingElements.resetBtn);
            settingElements.authDiv.appendChild(settingElements.hrDiv);
            settingElements.authDiv.appendChild(settingElements.warningDiv);
            settingElements.authDiv.appendChild(settingElements.passwordFields[0]);
            settingElements.authDiv.appendChild(settingElements.passwordFields[1]);
            settingElements.brTags.map(val => settingElements.authDiv.appendChild(val));
            settingElements.authDiv.appendChild(settingElements.changePwBtn);
            document.body.appendChild(settingElements.authDiv);
            resolve(settingElements);
        });
    }

    /**
     * Hides HTMLElements.authDiv || this.elements.authDiv
     * 
     * @param {object=} HTMLElements An object with HTMLElements, only required when this.elements is undefined
     * @returns {Promise<object>} The hidden object (auth essentially)
     */
    hide(HTMLElements) {
        return new Promise(resolve => {
            resolve(document.body.removeChild(((this.elements || { authDiv: undefined }).authDiv || HTMLElements).authDiv));
        });
    }
};


if (/register(\/.*)?$/.test(window.location.href)) {
    socket.emit("getCaptcha");
    socket.on("captcha", function (data) {
        const ctx = document.getElementsByTagName("canvas")[0].getContext("2d");
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(data.captcha, data.position.x, data.position.y);
    });

    document.getElementById("register-btn").addEventListener("click", function () {
        socket.emit("register", {
            username: document.getElementById("user").value,
            password: document.getElementById("pass").value,
            captcha: document.getElementById("captcha-input").value
        });
    });

    socket.on("register", function (data) {
        const element = document.createElement("div");
        if (document.getElementById("failure-notif")) {
            document.getElementById("auth").removeChild(document.getElementById("failure-notif"));
        }
        if ([400, 500].indexOf(data.status) > -1) {
            element.id = "failure-notif";
            element.innerHTML = data.message;
            document.getElementById("auth").prepend(element);
        } else {
            if (document.getElementById("success-notif")) {
                document.getElementById("auth").removeChild(document.getElementById("success-notif"));
            }
            document.getElementById("auth").innerHTML = message.replace("<type>", "success").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
        }
    });
} else if (/login(\/.*)?$/.test(window.location.href)) {
    document.getElementById("login-btn").addEventListener("click", function (data) {
        socket.emit("login", {
            username: document.getElementById("user").value,
            password: document.getElementById("pass").value
        });
        socket.on("login", function (data) {
            if ([400, 500].indexOf(data.status) > -1) {
                document.getElementById("auth").innerHTML = message.replace("<type>", "failure").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
            } else {
                document.getElementById("auth").innerHTML = message.replace("<type>", "success").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
                if (typeof data.session_id !== "undefined") document.location.href = server + "/app?sessionid=" + data.session_id;
            }
        });
    });
} else if (/app(\/.*)?/.test(window.location.href)) {
    var ready = false;
    const sessionid = (window.location.search.match(/[\?\&]sessionid=[^\&]{12,20}/) || []);
    if (sessionid.length > 0) {
        socket.emit("appCreate", sessionid[0].substr(sessionid[0].indexOf("=") + 1));
        socket.on("appCreate", async function (data) {
            if (data.status != 200) {
                console.error(JSON.stringify(data));
                document.location.href = server + "/login/";
            } else ready = true;
            const body = document.getElementsByTagName("body")[0]
            body.removeChild(document.getElementsByTagName("iframe")[0]);
            const mainMenu = new MainMenu();
            const elements = await mainMenu.run(data);
            elements.mmBoxesSTG.addEventListener("click", async () => {
                await mainMenu.hide(elements);
                const settingsMenu = new SettingsMenu();
                const settingElements = await settingsMenu.run(elements);
                settingElements.backBtn.addEventListener("click", async () => {
                    await settingsMenu.hide(settingElements);
                    await mainMenu.run(data);
                });
            });
            elements.logoutBtn.addEventListener("click", () => {
                socket.emit("sessionDelete", sessionid[0].substr(sessionid[0].indexOf("=") + 1));
            });
            socket.on("sessionDelete", () => document.location.href = "/login/");
        });
    } else {
        document.location.href = server + "/login/";
    }
}