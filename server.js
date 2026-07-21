// Minimal custom server for hosts (like cPanel's "Setup Node.js App" /
// Phusion Passenger) that require a plain Node.js entry point instead of the
// `next start` CLI. Passenger sets process.env.PORT and requires this file
// directly. See: https://nextjs.org/docs/app/guides/custom-server
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});
