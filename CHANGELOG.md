# auto-price-converter

## 2.1.0

### Minor Changes

- [#14](https://github.com/Xerrion/auto-price-converter/pull/14) [`a39720b`](https://github.com/Xerrion/auto-price-converter/commit/a39720ba72bd833275092dfb0e0b32df2e73c656) Thanks [@Xerrion](https://github.com/Xerrion)! - Refactor options page into modular components and improve CI pipeline

  - Split options page (521 lines) into 6 focused card components for better maintainability
  - Extract currency helpers to `$lib/currency.ts` for reusability
  - Consolidate CI workflows: faster PR checks (no build), build only on main push
  - Release workflow now trusts CI checks instead of re-running them

## 2.0.4

### Patch Changes

- Add Chrome Web Store automated publishing workflows

  - Automatically upload extension to Chrome Web Store on tag push
  - Add manual workflow to submit for Chrome Web Store review

## 2.0.3

### Patch Changes

- Optimize performance, bundle size, and code quality

  - Cache Intl.NumberFormat instances to improve price formatting performance
  - Replace expensive getComputedStyle calls with cheaper visibility checks
  - Debounce MutationObserver callbacks to batch DOM mutations
  - Add IntersectionObserver cleanup to prevent memory leaks
  - Remove unused React dependencies (lucide-react, next-themes, sonner)
  - Strip console.log statements in production builds
  - Add type declarations for findandreplacedomtext module

## 2.0.2

### Patch Changes

- a4d3111: Fix TypeScript error in formatter when indexing ALL_CURRENCIES with dynamic currency code

## 2.0.1

### Patch Changes

- 5b1ee99: Configure Railway backend URL for production builds and CI integration
