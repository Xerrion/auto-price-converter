import sharp from "sharp";
import { mkdir, cp } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const assetsDir = join(rootDir, "src", "assets");
const publicIconsDir = join(rootDir, "public", "icons");

const logoIconSvg = join(assetsDir, "logo-icon.svg");
const logoApcSvg = join(assetsDir, "logo-apc.svg");

const iconSizes = [16, 32, 48, 128];

async function generateIcons() {
  await mkdir(assetsDir, { recursive: true });
  await mkdir(publicIconsDir, { recursive: true });

  console.log("Generating icons...\n");

  console.log("📦 Extension icons from logo-icon.svg:");
  for (const size of iconSizes) {
    const outputPath = join(assetsDir, `icon${size}.png`);
    await sharp(logoIconSvg).resize(size, size).png().toFile(outputPath);
    console.log(`  ✓ icon${size}.png (${size}x${size})`);
    
    // Also copy to public/icons for WXT
    await cp(outputPath, join(publicIconsDir, `icon${size}.png`));
  }

  console.log("\n🎨 Full logo from logo-apc.svg:");
  const logoApcOutput = join(assetsDir, "logo-apc.png");
  await sharp(logoApcSvg).resize(440, 280).png().toFile(logoApcOutput);
  console.log(`  ✓ logo-apc.png (440x280)`);
  
  // Also copy to public/icons for WXT
  await cp(logoApcOutput, join(publicIconsDir, "logo-apc.png"));

  console.log("\n✅ All icons generated successfully!");
  console.log(`   Source directory: src/assets/`);
  console.log(`   Public directory: public/icons/`);
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
