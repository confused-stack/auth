const Config = require("./config.js");
const Server = require("./server.js");

module.exports =
class Application {
  constructor() {
    this.resourcePath = process.env["RESOURCE_PATH"] ?? "./data";
    this.config = new Config(this);
    this.server = new Server(this);
  }

  async init() {
    this.config.init();
    await this.server.init();
  }

  async start() {
    await this.server.start();
  }

  async close() {
    await this.server.stop();
  }
}
