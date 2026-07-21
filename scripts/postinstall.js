// Runs after every `npm install`.
//
// - Vercel: only generate the Prisma client here. Migrations run in the build
//   step instead (`npm run build` → `prisma migrate deploy && next build`),
//   where Vercel's environment variables are guaranteed to be present.
// - cPanel (no SSH): the Node.js Selector's "Run NPM Install" button is the
//   *only* deploy trigger, so this script must do everything — migrate and
//   rebuild. cPanel injects the app's env vars into this process, so we
//   detect that path by DATABASE_URL being present.
// - Local installs: no DATABASE_URL in the process env (it lives in .env,
//   which only prisma.config.ts loads), so we skip the slow migrate/build.
const { execSync } = require("child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

run("prisma generate");

if (process.env.VERCEL) {
  console.log("postinstall: Vercel detected — migrations run during `npm run build`.");
} else if (process.env.DATABASE_URL) {
  run("prisma migrate deploy");
  run("next build");
} else {
  console.log("postinstall: DATABASE_URL not set — skipping migrate/build (local install).");
}
