# Privacy Policy for Auto Price Converter

**Last updated: February 5, 2026**

## Summary

Auto Price Converter is a browser extension that converts prices on web pages to your preferred currency. **We do not collect, store, or transmit any personal data.**

## What the Extension Does

### Page Content Access

The extension reads text content on web pages to detect and convert prices. This processing happens **entirely in your browser** - no page content is ever sent to external servers.

### Local Data Storage

The extension stores the following data locally on your device using your browser's storage API:

- Your selected target currency
- Display preferences (decimal places, number format, highlighting)
- Site exclusion list (domains you've chosen to skip)
- Cached exchange rates (to reduce network requests)
- Theme preference (light/dark/system)

**This data never leaves your browser** and is not accessible to us or any third party.

### Network Requests

The extension makes requests to fetch current exchange rates:

- **API endpoint**: `https://apc-api.up.railway.app`
- **Data sources**: [Fixer.io](https://fixer.io/) and [Frankfurter](https://frankfurter.dev/) (European Central Bank data)
- **What is sent**: Only currency codes (e.g., "USD", "EUR") to request rates
- **What is NOT sent**: No personal data, no browsing history, no page content

### Backup & Restore

The extension allows you to export your settings as a JSON file. This file is saved directly to your device and is never uploaded anywhere.

## What We Do NOT Do

- We do NOT collect personal information
- We do NOT track your browsing history
- We do NOT store or transmit website content
- We do NOT use analytics or tracking tools
- We do NOT share data with third parties
- We do NOT use cookies or fingerprinting
- We do NOT require account creation or sign-in

## Permissions Explained

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Save your preferences and cached rates locally |
| `activeTab` | Get current tab URL for site exclusion feature |
| `Host permissions (all URLs)` | Detect and convert prices on any website you visit |

## Third-Party Services

Exchange rates are provided by:

- [Fixer.io](https://fixer.io/) - [Privacy Policy](https://fixer.io/privacy)
- [Frankfurter API](https://frankfurter.dev/) - Uses European Central Bank public data

These services only receive currency code requests, not any user data.

## Data Retention

- **Local storage**: Persists until you uninstall the extension or clear browser data
- **Exchange rate cache**: Refreshed every 24 hours

## Your Rights

You can:

- **View your data**: Check extension settings at any time
- **Export your data**: Use the Backup feature in Options
- **Delete your data**: Uninstall the extension or clear browser storage

## Open Source

This extension is open source. You can review the code at:
https://github.com/Xerrion/auto-price-converter

## Changes to This Policy

We may update this policy when adding new features. Changes will be reflected on this page with an updated date.

## Contact

Questions or concerns? Contact us at: admin@xerrion.dk
