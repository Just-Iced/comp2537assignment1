require('dotenv').config();

const express = require('express');
const { MongoClient } = require('mongodb');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const saltRounds = 12;

const expireAge = 60 * 60 * 1000; //60 minutes * 60 seconds * 1000 milliseconds

const app = express();
app.use(express.static(__dirname + "/public"));
const client = new MongoClient(process.env.MONGO_URI);
const users = client.db("test").collection("users");
client.connect()
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });
const mongoStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
});

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: mongoStore,
    cookie: {
        maxAge: expireAge
    },
}));

app.get("/", (req, res) => {
    res.send("Welcome to the home page!");
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

app.post("/loginUser", (req, res) => {
    const { email, password } = req.body;
    const schema = Joi.object({
        email: Joi.string().email().max(40).required(),
        password: Joi.string().min(6).max(20).required()
    });
    const err = schema.validate({ email, password });
    if (err.error) {
        return res.status(400).send(err.error.details[0].message);
    }
    users.findOne({ email })
        .then(user => {
            if (!user) {
                return res.status(400).send("User not found");
            }
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) {
                    return res.status(500).send("Error comparing passwords");
                }
                if (result) {
                    req.session.user = user;
                    return res.status(200).send("Login successful");
                } else {
                    return res.status(400).send("Invalid password");
                }
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Internal server error");
        });
});

app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/public/signup.html");
});

app.post("/registerUser", (req, res) => {
    const {email, password, password2} = req.body;
    const schema = Joi.object({
        email: Joi.string().email().max(40).required(),
        password: Joi.string().min(6).max(20).required(),
        password2: Joi.string().valid(Joi.ref('password')).required()
    });
    const err = schema.validate({ email, password, password2 });
    if (err.error) {
        return res.status(400).send(err.error.details[0].message);
    }
    const newUser = {
        email,
        password: bcrypt.hashSync(password, saltRounds)
    };
    users.insertOne(newUser).then(() => {
        req.session.user = newUser;
        res.status(200).send("User registered successfully");
    });
    
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});