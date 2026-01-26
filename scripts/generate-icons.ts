import { $ } from "bun";
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const inputSvg = join(rootDir, "src", "icons", "favicon.svg");
const outputDir = join(rootDir, "src", "icons");

const sizes = [16, 32, 48, 128];

async function generateIcons() {
  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  console.log("Generating icons from favicon.svg...\n");

  for (const size of sizes) {
    const outputPath = join(outputDir, `icon${size}.png`);

    await sharp(inputSvg).resize(size, size).png().toFile(outputPath);

    console.log(`✓ Created icon${size}.png (${size}x${size})`);
  }

  console.log("\n✅ All icons generated successfully!");
  console.log(`   Output directory: src/icons/`);
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
