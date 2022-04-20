const express = require('express');
const cors = require("cors");
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dotenv = require("dotenv");

dotenv.config();

const userService = require("./user-service.js");

const app = express();

const allowlist = ['http://localhost:4200', 'https://music-app-gulnar.netlify.app']
const corsOptionsDelegate = function (req, callback) {
  let corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

app.use(cors(corsOptionsDelegate))

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());


// JSON Web Token Setup
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

// Configure its options
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");

jwtOptions.secretOrKey = process.env.JWT_SECRET;
var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);

    if (jwt_payload) {
        // The following will ensure that all routes using 
        // passport.authenticate have a req.user._id, req.user.userName,
        // that matches the request payload data
        next(null, { _id: jwt_payload._id, 
            userName: jwt_payload.userName}); 
    } else {
        next(null, false);
    }
});

// tell passport to use our "strategy"
passport.use(strategy);

// add passport as application-level middleware
app.use(passport.initialize());



/* TODO Add Your Routes Here */
app.post("/api/user/register", (req, res) => {
    userService.registerUser(req.body)
        .then((user) => {
            res.json({ "message": "register successful" });
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});

app.post("/api/user/login", (req, res) => {
    console.log(req.body)
    userService.checkUser(req.body)
        .then((user) => {
            const payload = { 
                _id: user._id,
                userName: user.userName,
            };
            
            const token = jwt.sign(payload, jwtOptions.secretOrKey);
            res.json({ "message": "login successful","token": token });
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});

app.get("/api/user/favourites", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.getFavourites(req.body._id)
        .then((data) => {
            res.json(data);
        }).catch((msg) => {
            res.status(422).json({ "error": msg });
        });
});

app.put("/api/user/favourites/:id",passport.authenticate('jwt', { session: false }), (req, res) => {
    console.log(res.body._id)
    userService.addFavourite(req.body._id, id)
        .then((data) => {
            res.json(data);
        }).catch((msg) => {
            res.status(422).json({ "error": msg });
        });
});

app.delete("/api/user/favourites/:id",passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.removeFavourite(req.body._id, id)
        .then((data) => {
            res.json(data);
        }).catch((msg) => {
            res.status(422).json({ "error": msg });
        });
});


userService.connect()
.then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
})
.catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
});