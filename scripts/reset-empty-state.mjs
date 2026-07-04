import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data");

await mkdir(path.join(dataDir, "uploads"), { recursive: true });
await copyFile(
  path.join(dataDir, "seed.travel-journal.json"),
  path.join(dataDir, "travel-journal.json")
);

console.log("Travel journal reset to empty workspace state.");
