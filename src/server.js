const path = require("node:path");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const SessionFileStore = require("session-file-store")(session);
const GoogleStrategy = require("passport-google-oidc");

module.exports =
class Server {
  constructor(application) {
    this.application = application;
    this.config = this.application.config;

    this.app = express();
    this.passport = passport;
    this.sessionFileStore = new SessionFileStore({
      path: path.join(this.config.get("RESOURCE_PATH"), "sessions"),
      ttl: this.config.get("SESSION_FILE_STORE_TTL")
    });

    this.server;
  }

  async init() {
    // == Configure Passport
    this.passport.serializeUser((user, cb) => {
      process.nextTick(() => {
        // Allows the user object to be available via req.session.passport.user
        cb(null, user);
      });
    });

    this.passport.deserializeUser((user, cb) => {
      process.nextTick(() => {
        return cb(null, user);
      });
    });

    this.app.use(
      session({
        secret: this.config.get("SESSION_SECRET"),
        resave: false,
        saveUninitialized: false,
        store: this.sessionFileStore
      })
    );

    this.app.use(this.passport.authenticate("session"));

    this.passport.use(
      "google",
      new GoogleStrategy({
        clientID: this.config.get("GOOGLE_CLIENT_ID"),
        clientSecret: this.config.get("GOOGLE_CLIENT_SECRET"),
        callbackURL: "/callback",
        scope: ["profile", "email", "openid"]
      },
    (issuer, profile, cb) => {
      // TODO: This section is taken from confused-Techie/spt2
      // Additional research should be done to clarify it and confirm more widespread usage
      if (
        !Array.isArray(profile.emails) ||
        typeof profile.emails[0]?.value !== "string"
      ) {
        console.error(`Unrecognized email object retreived from Google.`);
        return cb("Unrecognized email object retreived from Google.");
      }

      const usrObj = {
        issuer: issuer,
        id: profile.id,
        display_name: profile.displayName,
        given_name: profile.name.givenName,
        family_name: profile.name.familyName,
        email: profile.emails[0].value
      };

      return cb(null, usrObj);
    })
    );

    // == Configure Express Endpoints

    // === HAProxy Login Check
    this.app.head("/check", (req, res) => {

    });

    // === Initiate Login Procedure
    this.app.get("/login", this.passport.authenticate("google"));

    // === Handle login procedure response
    this.app.get("/callback", (req, res) => {

    });
  }

  async start() {
    this.server = this.app.listen(this.config.get("PORT"), () => {
      console.log("Server starting...");
    });
  }

  async stop() {
    this.server.close(() => {
      console.log("HTTP Server Closed");
    });
  }
}
