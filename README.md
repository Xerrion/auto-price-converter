# Auto Price Converter

<p align="center">
  <img src="src/icons/icon128.png" alt="Auto Price Converter Logo" width="128" height="128">
</p>

<p align="center">
  A Chrome extension that <strong>automatically converts prices on websites</strong> to your chosen local currency using live exchange rates.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/auto-price-converter/njogpdjiklbgihogkdonlnhlonfhapjg">
    <img src="https://img.shields.io/chrome-web-store/v/njogpdjiklbgihogkdonlnhlonfhapjg?label=Chrome%20Web%20Store" alt="Chrome Web Store Version">
  </a>
  <a href="https://chromewebstore.google.com/detail/auto-price-converter/njogpdjiklbgihogkdonlnhlonfhapjg">
    <img src="https://img.shields.io/chrome-web-store/users/njogpdjiklbgihogkdonlnhlonfhapjg" alt="Chrome Web Store Users">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/xerrion/auto-price-converter" alt="License">
  </a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#supported-currencies">Currencies</a> •
  <a href="#privacy">Privacy</a>
</p>

---

## Features

- **Automatic Price Detection** — Intelligently detects prices in 12 major currencies on any website
- **Live Exchange Rates** — Fetches current rates from Fixer.io and Frankfurter
- **Dynamic Content Support** — Watches for dynamically loaded content and converts new prices in real-time
- **Highly Customizable** — Choose your target currency, number format, decimal places, and display preferences
- **Modern UI** — Beautiful popup and options page for easy configuration
- **Platform-Aware** — Special handling for popular e-commerce sites (Amazon, eBay, etc.)

## Installation

### From Chrome Web Store

<p align="center">
  <a href="https://chromewebstore.google.com/detail/auto-price-converter/njogpdjiklbgihogkdonlnhlonfhapjg">
    <img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png" alt="Available in the Chrome Web Store" width="248">
  </a>
</p>

<details>
<summary>Manual Installation (Developer Mode)</summary>

1. Download or clone this repository
2. Install dependencies and build:
   ```bash
   bun install
   bun run build
   ```
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable **Developer mode** (toggle in the top right)
5. Click **Load unpacked**
6. Select the `dist` folder from this project

</details>

## Usage

### Quick Start

1. Click the extension icon in your toolbar to open the popup
2. Toggle the extension **ON**
3. Select your **target currency** (the currency you want prices converted to)
4. Browse any website — prices will be automatically converted!

### Settings

Access the full options page by clicking the **gear icon** in the popup or right-clicking the extension icon and selecting "Options".

| Setting                 | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| **Target Currency**     | The currency to convert all prices to                             |
| **Show Original Price** | Display the original price alongside the converted price          |
| **Highlight Converted** | Add a visual highlight to converted prices                        |
| **Decimal Places**      | Number of decimal places for converted prices (0-4)               |
| **Number Format**       | Choose your preferred number format (US, European, French, Swiss) |

### Number Format Examples

| Format              | Example      |
| ------------------- | ------------ |
| US/UK (1,234.56)    | $1,234.56    |
| European (1.234,56) | €1.234,56    |
| French (1 234,56)   | €1 234,56    |
| Swiss (1'234.56)    | CHF 1'234.56 |

## Supported Currencies

### Detectable Currencies (Source)

The extension can detect and convert **FROM** these 12 major currencies:

| Code | Currency           | Symbol |
| :--: | ------------------ | :----: |
| EUR  | Euro               |   €    |
| USD  | US Dollar          |   $    |
| GBP  | British Pound      |   £    |
| JPY  | Japanese Yen       |   ¥    |
| CHF  | Swiss Franc        |  CHF   |
| CAD  | Canadian Dollar    |  CA$   |
| AUD  | Australian Dollar  |   A$   |
| NZD  | New Zealand Dollar |  NZ$   |
| CNY  | Chinese Yuan       |   ¥    |
| SEK  | Swedish Krona      |   kr   |
| NOK  | Norwegian Krone    |   kr   |
| DKK  | Danish Krone       |   kr   |

### Target Currencies

You can convert **TO** any of these 30 currencies:

|     |     |     |     |     |     |
| :-: | :-: | :-: | :-: | :-: | :-: |
| AUD | BRL | CAD | CHF | CNY | CZK |
| DKK | EUR | GBP | HKD | HUF | IDR |
| ILS | INR | ISK | JPY | KRW | MXN |
| MYR | NOK | NZD | PHP | PLN | RON |
| SEK | SGD | THB | TRY | USD | ZAR |

## Privacy

This extension respects your privacy:

- Only reads page content to detect prices
- Stores settings locally in Chrome storage
- Only contacts exchange rate services for current rates
- Does **NOT** collect or transmit any personal data
- Does **NOT** track your browsing history

## Credits

- Exchange rates provided by [Fixer.io](https://fixer.io/) and [Frankfurter API](https://frankfurter.dev/)
- UI components from [shadcn-svelte](https://shadcn-svelte.com/)
- Icons from [Lucide](https://lucide.dev/)

## Support

If you find this extension useful, consider supporting its development:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-ff5f5f?logo=ko-fi&logoColor=white)](https://ko-fi.com/xerrion)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github)](https://github.com/sponsors/xerrion)

---

## For Developers

<details>
<summary>Development Setup & Contributing</summary>

### Tech Stack

- [Vite](https://vitejs.dev/) — Fast development and optimized builds
- [Svelte 5](https://svelte.dev/) — Reactive UI with runes
- [TypeScript](https://www.typescriptlang.org/) — Full type safety
- [Tailwind CSS v4](https://tailwindcss.com/) — Utility-first styling
- [shadcn-svelte](https://shadcn-svelte.com/) — Beautiful, accessible components
- Chrome Manifest V3 — Modern extension APIs

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- Chrome browser

### Setup

```bash
# Clone the repository
git clone https://github.com/xerrion/auto-price-converter.git
cd auto-price-converter

# Install dependencies
bun install

# Start development server with hot reload
bun run dev
```

### Available Scripts

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `bun run dev`            | Start development server with hot reload |
| `bun run build`          | Build for production                     |
| `bun run check`          | Run Svelte type checker                  |
| `bun run test`           | Run tests with Vitest                    |
| `bun run test:run`       | Run tests once                           |
| `bun run generate-icons` | Generate icon sizes from source          |

### Testing

```bash
# Run tests in watch mode
bun run test

# Run tests once
bun run test:run
```

### Building for Production

```bash
bun run build
```

The built extension will be in the `dist` folder.

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

</details>

## License

GPLv3 License — see [LICENSE](LICENSE) for details
