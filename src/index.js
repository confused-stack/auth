const Application = require("./app.js");
const app = new Application();

(async () => {
  await app.init();
  await app.start();
})();

process.on("SIGTERM", async () => {
  await exterminate("SIGINT");
});

process.on("SIGINT", async () => {
  await exterminate("SIGINT");
});

async function exterminate(callee) {
  console.log(`${callee} signal received: Shutting down...`);
  await app.close();
}
