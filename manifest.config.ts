import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Auto Price Converter",
  description:
    "Automatically converts prices on websites to your chosen currency using live exchange rates",
  version: "2.0.1",
  icons: {
    "16": "src/icons/icon16.png",
    "32": "src/icons/icon32.png",
    "48": "src/icons/icon48.png",
    "128": "src/icons/icon128.png",
  },
  action: {
    default_popup: "src/popup/index.html",
    default_icon: {
      "16": "src/icons/icon16.png",
      "32": "src/icons/icon32.png",
      "48": "src/icons/icon48.png",
      "128": "src/icons/icon128.png",
    },
    default_title: "Price Converter",
  },
  options_page: "src/options/index.html",
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  permissions: ["storage", "activeTab"],
  host_permissions: [
    "http://localhost:8000/*",
    "https://api.your-backend.example/*",
  ],
});
