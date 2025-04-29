require("dotenv").config()
const session = require("express-session");
const express = require("express");
const bcrypt = require("bcrypt");
const MongoStore = require("connect-mongo");

const app = express();
const port = process.env.port || 3000;
const saltRounds = 12;

app.use(session({
    resave: false,
    saveUninitialized: true,
}));

app.use("/", (req, res) => {
    res.send("Hello world");
});

app.listen(port, () => {
    console.log("Node listening on port " + port);
});