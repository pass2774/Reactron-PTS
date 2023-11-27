"use strict";

const cors = require("cors");
const express = require("express");
const process = require("process");
require("dotenv").config();

const bodyParser = require("body-parser");

const https = require("https");
const fs = require("fs");
const appServer_v0_1 = require("./appServer_v0.1/appServer");

// if (process.env.NODE_ENV === "production") {
//   // multi-core
//   cluster.schedulingPolicy = cluster.SCHED_RR;
//   if (cluster.isMaster) {
//     for (let i = 0; i < os.cpus().length; ++i) {
//       cluster.fork();
//     }

//     cluster.on("exit", (worker) => {
//       console.log("Worker " + worker.process.pid + " is dead");
//       cluster.fork();
//     });
//   } else {
//     startServer();
//   }
// } else {
// single-core
startServer();
// }

function startServer() {

    let app = createApp();

    // if (process.env.NODE_ENV === "production") {
    //   // http server. SSL is applied on the load balancer.
    //   const server = app.listen(process.env.PORT || 3333, () => {
    //     console.log("Started the server on " + process.pid);
    //   });
    //   appServer_v0_1.createSocketApp(server);
    // } else {

    //https server. We do not have load balancer during development.
    const credentials = {
        key: fs.readFileSync(process.env.PORTAL_CERT_KEY), // for bird localhost
        cert: fs.readFileSync(process.env.PORTAL_CERT), // for bird localhost
        requestCert: false,
        rejectUnauthorized: false,
    };

    const server = https.createServer(credentials, app);
    server.listen(process.env.PORT || 3333, () => {
        console.log("Started the server on " + process.pid);
        console.log("Under development mode, make sure to permit SSL certificate on your browser.");
    });

    appServer_v0_1.createSocketApp(server);
    // }
}

function createApp() {
    const app = express();
    app.use(cors());
    // app.use(express.static("public"));
    //app.set("view engine", "ejs");
    app.use(express.json());
    app.use(bodyParser.json({ limit: "50mb" }));
    app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
    app.use(express.urlencoded({ extended: true }));

    app.get("/", (req, res) => {
        res.send("<h1>Camera Server is Running!</h1>");
    });
    return app;
}
