// Package imports
import express = require("express");
import * as fs from "fs";
import * as ws from "ws";
import * as sqlite from "sqlite";

// Other imports
import Base from "./structures/Base";

// Init base
const base: Base = new Base({
    server: {
        app: express(),
        port: Number(process.env.PORT) || 3000,
        readyCallback: () => {
            console.log("WebServer running!");
        }
    },
    wsServer: new ws.Server({
        port: 8080
    }),
    database: sqlite
});

// Init database/routes
base.initializeDatabase("./db.sqlite")
    .then(() => {
        console.log(`Token for database: ${base.dbToken}`);
    })
    .catch(console.log);
base.initializeRoutes().catch(console.error);