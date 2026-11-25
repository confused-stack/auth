const path = require("node:path");
const { performance } = require("node:perf_hooks");
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
    // == Configure request logging middleware
    this.app.use((req, res, next) => {
      const start = performance.now();
      const date = new Date();

      res.once("finish", () => {
        // Since unlock KoaJS we can't just run this after `next` we have to listen to finish events
        console.log(`HTTP> ${req.ip} - '${req.session?.passport?.user?.email ?? "ANONYMOUS"}' [${date.toISOString()}] "${req.method} ${req.protocol}://${req.host}${req.url}" ${res.statusCode} - ${Number.parseFloat(performance.now() - start).toFixed(2)}ms`);
      });
      next();
    });

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
      console.log("DEBUG: profile:");
      console.log(profile);
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
      console.log(`/check: X-Original-Host: '${req.headers["x-original-host"]}'; X-Original-URI: '${req.headers["x-original-uri"]}'`);
      if (req.isAuthenticated()) {
        return res.sendStatus(200); // TODO testing needed
      } else {
        const host = req.get("X-Original-Host");
        const uri = req.get("X-Original-URI");

        // TODO here would be a good place to validate allowed services
        const returnTo = new URL(uri, `http://${host}`);

        if (returnTo.origin !== `http://${host}`) {
          return res.sendStatus(400);
        }

        const login = new URL(`${this.config.get("AUTH_SERVICE_URL")}/login`);
        login.searchParams.set("returnTo", returnTo.href);
        res.redirect(302, login.href);
      }
    });

    // === Initiate Login Procedure
    this.app.get("/login", (req, res, next) => {
      const returnTo = req.query.returnTo;

      if (typeof returnTo === "string") {
        // ^^ TODO Do we validate where we return to? Otherwise we get an OpenRedirect Vuln
        req.session.returnTo = returnTo;
        // If there's no `returnTo` available we handle that after authentication
      }

      // Persist 'returnTo' before redirect
      req.session.save((err) => {
        if (err) return next(err);
        passport.authenticate("google")(req, res, next);
      });
    });

    // === Handle login procedure response
    this.app.get(
      "/callback",
      this.passport.authenticate("google", { failureRedirect: "/login", keepSessionInfo: true }),
      // TODO ^^ Passport removed keepSessionInfo for security reasons, a manual implementation here
      // could fix the security vuln while keeping the `returnTo` value we care about
      (req, res, next) => {
      if (req.isAuthenticated()) {
        const user = req.session.passport.user; // TODO do we maintain service access?
        const returnTo = req.session.returnTo;
        console.log(`/callback: Return To: '${returnTo}'; User: '${user.email}'`);

        delete req.session.returnTo;

        req.session.save((err) => {
          if (err) return next(err);

          if (returnTo) {
            // ^^ TODO Do we validate where we return to? Otherwise we get an OpenRedirect Vuln
            res.redirect(returnTo);
          } else {
            res.redirect(this.config.get("DEFAULT_REDIRECT_URL"));
          }
        });
      } else {
        // Why didn't the failure redirect capture this? Manually redirect
        res.redirect("/login");
      }
    });

    // === Handle clearing all current logins
    this.app.get("/clear", async (req, res, next) => {
      await this.sessionFileStore.clear();
      res.sendStatus(200);
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
