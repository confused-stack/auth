
const DEFAULT = {
  SESSION_FILE_STORE_TTL: 9000,
  SESSION_SECRET: "test",
  PORT: 8080,
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: ""
};

module.exports =
class Config {
  constructor(application) {
    this.resourcePath = application.resourcePath;
    this.default = DEFAULT;
    this.default["RESOURCE_PATH"] = this.resourcePath;
  }

  get(name) {
    return process.env[name] ?? this.default[name] ?? null;
  }
}
