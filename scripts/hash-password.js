const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage: npm run hash-password -- <your-password>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
// Base64-encoded: a raw bcrypt hash is full of `$`, which Next.js's .env
// loader (dotenv-expand) treats as variable-reference syntax and silently
// mangles. Base64 round-trips cleanly through .env regardless.
console.log(Buffer.from(hash, "utf8").toString("base64"));
