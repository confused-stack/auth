const fs = require("node:fs");
const path = require("node:path");

const DEFAULT = {
  SESSION_FILE_STORE_TTL: 9000,
  SESSION_SECRET: "test",
  PORT: 8080,
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  DEFAULT_REDIRECT_URL: "",
  AUTH_SERVICE_URL: "http://auth.example.com"
};

module.exports =
class Config {
  constructor(application) {
    this.resourcePath = application.resourcePath;
    this.default = DEFAULT;
    this.default["RESOURCE_PATH"] = this.resourcePath;
    this.settings = {};
    this.configFileLocation = null;
  }

  init() {
    // Load config from disk
    const files = fs.readdirSync(this.resourcePath);

    for (const file of files) {
      if (file === "config.json") {
        this.configFileLocation = path.join(this.resourcePath, file);
      }
    }

    if (typeof this.configFileLocation === "string") {
      try {
        this.settings = JSON.parse(fs.readFileSync(this.configFileLocation, { encoding: "utf-8" }));
      } catch(err) {
        console.error(`There was a problem reading the configuration file: ${err.toString()}`);
        console.error(err);
      }
    }
  }

  get(name) {
    return process.env[name] ?? this.settings[name] ?? this.default[name] ?? null;
  }
}
