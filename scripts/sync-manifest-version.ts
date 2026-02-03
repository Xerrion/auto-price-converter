import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const packagePath = path.join(root, "package.json");
const manifestPath = path.join(root, "manifest.config.ts");

const packageJson = JSON.parse(readFileSync(packagePath, "utf-8")) as {
  version?: string;
};

if (!packageJson.version) {
  throw new Error("package.json is missing a version field.");
}

const manifestSource = readFileSync(manifestPath, "utf-8");
const updatedSource = manifestSource.replace(
  /version:\s*"[^"]+"/,
  `version: "${packageJson.version}"`,
);

if (updatedSource === manifestSource) {
  throw new Error("Failed to update manifest version.");
}

writeFileSync(manifestPath, updatedSource);
console.log(`Synced manifest version to ${packageJson.version}.`);
