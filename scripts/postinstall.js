// Runs after every `npm install`. On cPanel (no SSH access), the Node.js
// Selector's "Run NPM Install" button is the *only* build trigger available,
// so this script also generates the Prisma client, applies migrations, and
// runs the production build. On Vercel, the platform runs its own `next
// build` right after install, so we skip building here to avoid doing it
// twice — Vercel sets the VERCEL env var automatically.
const { execSync } = require("child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

run("prisma generate");
run("prisma migrate deploy");

if (!process.env.VERCEL) {
  run("next build");
}
