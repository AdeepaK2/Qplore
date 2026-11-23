// Prints the seeded-bug answer key. Run: npm run reveal-bugs -- --yes
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (!process.argv.includes("--yes")) {
  console.log("Spoiler! Finish your own testing first.");
  console.log("When you are ready:  npm run reveal-bugs -- --yes");
  process.exit(0);
}
const dir = path.dirname(fileURLToPath(import.meta.url));
console.log(Buffer.from(fs.readFileSync(path.join(dir, "bugs.b64"), "utf8"), "base64").toString("utf8"));
