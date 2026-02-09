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

This project uses **Release Please** for automated version management and changelog generation.

#### How It Works

1. **Make changes** using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add new feature` → Minor version bump
   - `fix: resolve bug` → Patch version bump
   - `feat!: breaking change` or `BREAKING CHANGE:` → Major version bump

2. **Merge to main** → Release Please automatically creates/updates a Release PR with:
   - Version bump in `package.json` and `manifest.config.ts`
   - Updated `CHANGELOG.md`

3. **Merge the Release PR** → Automatically:
   - Creates a GitHub Release
   - Creates a git tag
   - Builds and attaches the extension ZIP

#### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` - New feature (minor bump)
- `fix` - Bug fix (patch bump)
- `perf` - Performance improvement
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `docs` - Documentation only
- `chore` - Maintenance tasks
- `test` - Adding or updating tests
- `ci` - CI/CD changes

#### Configuration Files

- `release-please-config.json` - Release Please configuration
- `.release-please-manifest.json` - Tracks current version

#### Required Secret

- `RELEASE_TOKEN` - A GitHub PAT with `contents: write` permission (Fine-grained PAT)

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

## Git Conventions

### Workflow

This project uses a **feature branch** workflow:

1. **Always work on feature branches** — never commit directly to `main`
2. **Always create PRs** for code review before merging
3. **Keep commits atomic** — each commit should touch as few files as possible

### Branch Naming

Use prefixes that match your commit type:

- `feat/` - New features (e.g., `feat/dark-mode`)
- `fix/` - Bug fixes (e.g., `fix/price-parsing`)
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format (required for Release Please):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat` - New feature (triggers minor version bump)
- `fix` - Bug fix (triggers patch version bump)
- `perf` - Performance improvement
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `docs` - Documentation only
- `chore` - Maintenance tasks
- `test` - Adding or updating tests
- `ci` - CI/CD changes

**Examples:**

```bash
feat: add dark mode toggle
fix: correct price parsing for Swiss format
docs: update README with new features
chore: update dependencies
feat!: redesign settings page  # Breaking change
```

### Pull Requests

- **Update documentation** when behavior changes
- **Add or update tests** when it makes sense
- **Keep PRs narrow and well-scoped**
- Run `bun run check` before submitting
- Never commit `.env` files or secrets

## Common Issues

### Type Errors with ALL_CURRENCIES

The `ALL_CURRENCIES` object is readonly. When indexing it, ensure proper type guards:

```typescript
// ❌ Problematic
const currencyInfo = ALL_CURRENCIES[currency];

// ✅ Better with type guard
const currencyInfo = ALL_CURRENCIES[currency as keyof typeof ALL_CURRENCIES];
```
