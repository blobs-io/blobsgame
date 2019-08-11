// Package imports
import express = require("express");
import * as fs from "fs";
import * as ws from "ws";
import * as sqlite from "sqlite";
import cookieParser = require("cookie-parser");

// Other imports
import Base from "./structures/Base";
import Logger from "./structures/Logger";

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

base.server.app.use(cookieParser());

// Init database/routes
base.initializeDatabase("./db.sqlite")
    .then(() => {
        console.log(`Token for database: ${base.dbToken}`);
    })
    .catch(console.log);
base.initializeRoutes().catch(console.error);

// Initialize logger
const logger = new Logger(base);
logger.setInterval(() => {}, 60e3);

// Handle (Log/Check for maintenance) requests
base.server.app.use((req, res, next) => {
    if (base.maintenance.enabled && base.maintenance.reason) {
        res.send(fs.readFileSync("./backend/Maintenance.html", "utf8").replace(/{comment}/g, base.maintenance.reason));
        return;
    }
    if (/\/(\?.+)?$/.test(req.originalUrl)) {
        logger.requests.htmlOnly++;
        logger.sessionRequests.htmlOnly++;
    }
    if (req.originalUrl.startsWith("/game/")) {
        logger.requests.ffa++;
        logger.sessionRequests.ffa++;
    }
    logger.requests.total++;
    logger.sessionRequests.total++;
    return next();
});

// Listen to events / endpoints
base.initializeEvents().catch(() => {});
base.APIController.listen();
base.ClanController.listen();