# auto-price-converter

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
