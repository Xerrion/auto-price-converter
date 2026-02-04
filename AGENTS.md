# AGENTS.md - Coding Agent Guidelines

This file provides essential information for AI coding agents working in this repository.

## Project Overview

**Auto Price Converter** is a Chrome extension built with:

- **Svelte 5** + TypeScript for UI components
- **Vite** + `@crxjs/vite-plugin` for bundling
- **Bun** as the package manager
- **Vitest** for testing
- **Tailwind CSS v4** for styling

The extension automatically converts prices on websites to the user's chosen currency using live exchange rates.

## Package Manager

⚠️ **ALWAYS use `bun` as the package manager** - Never use npm or yarn.

```bash
bun install              # Install dependencies
bun add <package>        # Add a dependency
bun remove <package>     # Remove a dependency
```

## Build & Development Commands

### Development

```bash
bun run dev              # Start dev server with HMR on port 5173
bun run build            # Production build to ./dist
bun run preview          # Preview production build
```

### Testing

```bash
bun test                 # Run tests in watch mode
bun run test:run         # Run all tests once (CI mode)
vitest run <file>        # Run a specific test file
bun test <pattern>       # Run tests matching pattern
```

**Running a single test file:**

```bash
vitest run src/content/parsers/priceParser.test.ts
```

### Code Quality

```bash
bun run check            # Run svelte-check for type checking
```

### Icon Generation

```bash
bun run generate-icons   # Generate extension icons from source
```

### Versioning & Releases

This project uses **Changesets** for version management and changelog generation.

#### Release Workflow

1. **Create a changeset** - Describe your changes:
   ```bash
   bun run changeset
   ```
   This creates a file in `.changeset/` describing the change and version bump type (patch/minor/major).

2. **Bump version** - When ready to release:
   ```bash
   bun run version
   ```
   This consumes changesets, updates `package.json`, `manifest.config.ts`, and appends to `CHANGELOG.md`.

3. **Commit & push** - Commit the version bump.

4. **Create a tag** - Triggers the release workflow:
   ```bash
   git tag v<version>
   git push origin v<version>
   ```

#### Notes

- The `tag-release.yml` workflow automatically creates tags when `package.json` version changes on main
- `GITHUB_TOKEN` environment variable is required for `bun run version` to generate GitHub-linked changelogs
- Changelog entries are extracted from `CHANGELOG.md` and used in GitHub Release notes

## Project Structure

```text
src/
├── background/          # Background service worker
├── content/             # Content scripts (price detection & conversion)
│   ├── parsers/         # Price parsing and formatting
│   ├── scanners/        # DOM scanning for prices
│   └── utils/           # Content script utilities
├── lib/                 # Shared utilities and types
│   ├── components/ui/   # Svelte UI components (shadcn-svelte)
│   ├── types.ts         # Type definitions
│   ├── storage.ts       # Chrome storage API wrappers
│   └── exchangeRates.ts # Exchange rate fetching
├── popup/               # Extension popup UI
├── options/             # Extension options page
└── icons/               # Extension icons
```

## Documentation Access

⚠️ **ALWAYS consult Context7 documentation when unsure** about library APIs, features, or best practices.

Before implementing features or using unfamiliar APIs:

1. **Query Context7** for the relevant library documentation (Svelte 5, Vitest, Chrome Extensions, etc.)
2. **Use `resolve-library-id`** first to get the correct library ID
3. **Use `query-docs`** to get up-to-date API documentation and examples

**Examples of when to use Context7:**

```typescript
// ❌ Don't guess Svelte 5 runes syntax
// ✅ Ask Context7: "How to use $effect in Svelte 5?"

// ❌ Don't assume Chrome API behavior
// ✅ Ask Context7: "How to use chrome.storage.sync API?"

// ❌ Don't guess Vitest testing patterns
// ✅ Ask Context7: "How to mock modules in Vitest?"
```

**This prevents:**
- Using outdated or incorrect API patterns
- Making assumptions about library features
- Missing better approaches that exist in the documentation

## Code Style Guidelines

### General Principles

- **Prefer existing patterns** in `src/` — avoid large refactors
- **Keep changes minimal and focused**
- **Keep functions small and testable**
- Follow the existing code organization and naming conventions

### TypeScript

#### Strict Mode

- TypeScript strict mode is enabled in `tsconfig.json`
- All code must pass type checking
- Use explicit types when it improves clarity
- Avoid `any` type — use `unknown` if necessary

#### Type Imports

```typescript
// Prefer type-only imports
import type { Settings, ExchangeRates } from "../lib/types";

// Regular imports for runtime values
import { ALL_CURRENCIES, NUMBER_FORMATS } from "../lib/types";
```

#### Path Aliases

```typescript
// Use $lib alias for library imports
import { getSettings } from "$lib/storage";
import type { Settings } from "$lib/types";
```

### Naming Conventions

- **Files**: camelCase for TypeScript files (e.g., `priceParser.ts`)
- **Components**: PascalCase for Svelte components (e.g., `App.svelte`)
- **Functions**: camelCase (e.g., `formatPrice`, `parsePrice`)
- **Types/Interfaces**: PascalCase (e.g., `Settings`, `ExchangeRates`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_SETTINGS`, `CACHE_DURATION_MS`)

### Imports Organization

1. Type imports (sorted)
2. External dependencies
3. Internal imports (grouped by type: utils, components, etc.)

```typescript
import type { Settings, ExchangeRates } from "../lib/types";
import type { CurrencyCode } from "../lib/types";

import { parsePrice } from "./parsers/priceParser";
import { formatPrice } from "./parsers/formatter";
```

### Error Handling

#### Async Functions

```typescript
// Wrap Chrome API calls in try-catch
async function init(): Promise<void> {
  try {
    const settings = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
    // Handle success
  } catch (error) {
    console.error("Failed to initialize", error);
  }
}
```

#### Chrome Storage

```typescript
// Use Promise wrappers for chrome.storage API
export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["settings"], (result) => {
      resolve(normalizeSettings(result.settings));
    });
  });
}
```

### Svelte 5 Conventions

#### Props & State (Runes)

```svelte
<script lang="ts">
  // Use $props() for component props
  let { variant = "default", size = "default" }: ButtonProps = $props();

  // Use $state for reactive state
  let count = $state(0);

  // Use $derived for computed values
  let doubled = $derived(count * 2);
</script>
```

#### Event Handlers

```svelte
<button onclick={() => handleClick()}>Click me</button>
```

### Testing

- Write tests for all price parsing and formatting logic
- Test both success and error cases
- Use descriptive test names that explain what is being tested

```typescript
describe("parsePrice", () => {
  it("parses symbol before amount ($10.50)", () => {
    const result = parsePrice("$10.50");
    expect(result).toEqual({ amount: 10.5, currency: "USD" });
  });
});
```

## Common Patterns

### Chrome Storage Access

```typescript
import { getSettings, saveSettings } from "$lib/storage";

const settings = await getSettings();
await saveSettings(updatedSettings);
```

### Message Passing

```typescript
// Content script to background
const response = await chrome.runtime.sendMessage({
  type: "GET_RATES",
});

// Background listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_RATES") {
    // Handle message
  }
});
```

## Git Workflow

This project uses a **feature branch** workflow:

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** and commit with descriptive messages

3. **Push the branch** and create a Pull Request:
   ```bash
   git push -u origin feature/my-feature
   ```

4. **After PR approval**, merge to `main`

### Branch Naming Conventions

- `feature/` - New features (e.g., `feature/dark-mode`)
- `fix/` - Bug fixes (e.g., `fix/price-parsing`)
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

## Pull Requests

- **Update documentation** when behavior changes
- **Add or update tests** when it makes sense
- **Keep PRs narrow and well-scoped**
- Run `bun run check` before submitting

## Common Issues

### Type Errors with ALL_CURRENCIES

The `ALL_CURRENCIES` object is readonly. When indexing it, ensure proper type guards:

```typescript
// ❌ Problematic
const currencyInfo = ALL_CURRENCIES[currency];

// ✅ Better with type guard
const currencyInfo = ALL_CURRENCIES[currency as keyof typeof ALL_CURRENCIES];
```
