import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const iconsDir = join(rootDir, "src", "icons");

const logoIconSvg = join(iconsDir, "logo-icon.svg");
const logoApcSvg = join(iconsDir, "logo-apc.svg");

const iconSizes = [16, 32, 48, 128];

async function generateIcons() {
  await mkdir(iconsDir, { recursive: true });

  console.log("Generating icons...\n");

  console.log("📦 Extension icons from logo-icon.svg:");
  for (const size of iconSizes) {
    const outputPath = join(iconsDir, `icon${size}.png`);
    await sharp(logoIconSvg).resize(size, size).png().toFile(outputPath);
    console.log(`  ✓ icon${size}.png (${size}x${size})`);
  }

  console.log("\n🎨 Full logo from logo-apc.svg:");
  const logoApcOutput = join(iconsDir, "logo-apc.png");
  await sharp(logoApcSvg).resize(440, 280).png().toFile(logoApcOutput);
  console.log(`  ✓ logo-apc.png (440x280)`);

  console.log("\n✅ All icons generated successfully!");
  console.log(`   Output directory: src/icons/`);
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
