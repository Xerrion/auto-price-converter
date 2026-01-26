# Chrome Svelte Extension Template

A modern Chrome extension template built with **Svelte 5**, **TypeScript**, and **Vite**.

## Features

- 🚀 **Svelte 5** with runes for reactive state management
- 📘 **TypeScript** with Chrome types for full type safety
- ⚡ **Vite** for fast development and optimized builds
- 📦 **Bun** as the package manager
- 🧩 **Manifest V3** compliant

## Project Structure

```
src/
├── background/       # Service worker (background script)
│   └── index.ts
├── content/          # Content scripts (injected into pages)
│   └── index.ts
├── popup/            # Extension popup UI
│   ├── App.svelte
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── options/          # Extension options page
│   ├── App.svelte
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── lib/              # Shared utilities
│   ├── index.ts
│   ├── messaging.ts
│   ├── storage.ts
│   └── types.ts
├── icons/            # Extension icons (add your own)
└── manifest.json     # Chrome extension manifest
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your system
- Chrome browser

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Build with watch mode for development
bun run dev
```

### Production Build

```bash
# Build for production
bun run build
```

### Type Checking

```bash
# Run Svelte type checker
bun run check
```

## Loading the Extension in Chrome

1. Run `bun run build` to build the extension
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `dist` folder from this project

## Adding Icons

Create icons in the following sizes and place them in `src/icons/`:

- `icon16.png` (16x16)
- `icon32.png` (32x32)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

## Customization

### Manifest

Edit `src/manifest.json` to:

- Change extension name and description
- Add/remove permissions
- Configure content script matches
- Set up additional features

### Permissions

Common permissions you might need:

```json
{
  "permissions": [
    "storage", // Store data
    "activeTab", // Access current tab
    "tabs", // Full tab access
    "notifications" // Show notifications
  ]
}
```

## License

MIT
