require("dotenv").config();
const express = require("express");
const requestLogger = require("./middleware/reqLogger");
const { setIO } = require("./config/socketSetup");
const { socketConfig } = require("./config/socketConfig");
const router = require('./routes/index');
const db  = require('./config/db');
require('./helpers/cron');
const cors = require("cors")
const http = require("http");
const https = require("https");
const fs = require('fs')
const app = express();
const PORT = process.env.PORT;
const HOST = process.env.NODE_ENV == "LOCAL" ? process.env.LOCALHOST : process.env.SERVERHOST;
let projectName = process.env.PROJECT_NAME
// var corsOptions = {
//     origin: [`http://${HOST}:${PORT}`, `http://localhost:3000`, `http://${HOST}`],
//     optionsSuccessStatus: 200,
// };
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger)

const options = {
    ...(process.env.NODE_ENV != "LOCAL" && {
        key: fs.readFileSync(process.env.PRIVATEKEY),
        cert: fs.readFileSync(process.env.CERTKEY),
    }),
};
const server = process.env.NODE_ENV == "LOCAL" ? http.createServer(app) : https.createServer(options, app);

let io = setIO(server);
socketConfig(io);


app.get("/", async (req, res) => {
    res.send("hello==========================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
});

const start = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Connection has been established successfully.');
        console.log("...........................................................................")

        // await db.Shift.sync({ alter : true });
        // await db.Student.sync({ alter : true });
        // await db.Invoice.sync({ alter : true });

        // Auto-create transport tables added during the transport module build.
        // sync() with no options uses CREATE TABLE IF NOT EXISTS — safe to run on every boot.
        await db.DriverLocation.sync();

        // Add new columns to tbl_student_transports if they don't exist yet.
        // Each ALTER is wrapped in try/catch so re-runs are harmless.
        const addColumnIfMissing = async (sql) => {
          try { await db.sequelize.query(sql); } catch (_) {}
        };
        await addColumnIfMissing(
          "ALTER TABLE tbl_student_transports ADD COLUMN dropoff_recipient_type ENUM('parent','authorized_person') NULL COMMENT 'Type of person who received student at dropoff' AFTER dropoff_longitude"
        );
        await addColumnIfMissing(
          "ALTER TABLE tbl_student_transports ADD COLUMN dropoff_recipient_name VARCHAR(255) NULL COMMENT 'Name of person who received student at dropoff' AFTER dropoff_recipient_type"
        );

        console.log('Transport tables ready.');

        server.listen(PORT, () => {
            console.log(`${projectName} is running on ${process.env.NODE_ENV == "LOCAL" ? "http" : "https"}://${HOST}:${PORT}/ ...`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};
start();

app.use(router);

// Error handling for unexpected issues
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(400).send({ error: err.message });
});

app.all("*", (req, res) => {
    res.status(405).json({ message: "The method is not allowed for the requested URl" });
});

