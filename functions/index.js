
const functions = require("firebase-functions");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
  conf: { distDir: ".next" }, // Points to the Next.js build output directory
});
const handle = app.getRequestHandler();

exports.nextApp = functions.https.onRequest((req, res) => {
  // It's important to wait for the Next.js app to be prepared before handling requests.
  return app.prepare().then(() => handle(req, res));
});
