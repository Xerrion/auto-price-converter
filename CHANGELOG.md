# auto-price-converter

## [3.0.0](https://github.com/Xerrion/auto-price-converter/compare/auto-price-converter-v2.3.0...auto-price-converter-v3.0.0) (2026-02-09)


### ⚠ BREAKING CHANGES

* Migrate from @crxjs/vite-plugin to WXT framework

### Features

* migrate to WXT for Chrome and Firefox support ([#37](https://github.com/Xerrion/auto-price-converter/issues/37)) ([f0f9497](https://github.com/Xerrion/auto-price-converter/commit/f0f9497c4b8161d9684699db90efb2379d3fb03c))


### Bug Fixes

* convert webstore description to plain text format ([#34](https://github.com/Xerrion/auto-price-converter/issues/34)) ([4f0cb24](https://github.com/Xerrion/auto-price-converter/commit/4f0cb245bbccfe80525287697a6323ae0e156af9))
* correct version extraction for release-please tag format ([#36](https://github.com/Xerrion/auto-price-converter/issues/36)) ([c32f0a1](https://github.com/Xerrion/auto-price-converter/commit/c32f0a15de4be4182b3f44380906f8e9d30d728a))

## [2.3.0](https://github.com/Xerrion/auto-price-converter/compare/auto-price-converter-v2.2.0...auto-price-converter-v2.3.0) (2026-02-09)


### Features

* add 7 new currency symbols (NGN, VND, KZT, BDT, RUB, GHS, GEL) ([0158349](https://github.com/Xerrion/auto-price-converter/commit/0158349a25b8f2e07402d6e440d4a05f7eced367))
* add 7 new currency symbols and consolidate detection constants ([6ed50f9](https://github.com/Xerrion/auto-price-converter/commit/6ed50f94ee3c20b04bddd85651fee5c94ce58ed5))
* add brand logo assets and update icon generation ([#27](https://github.com/Xerrion/auto-price-converter/issues/27)) ([bbae5bc](https://github.com/Xerrion/auto-price-converter/commit/bbae5bc1c70598f24c2f320e06f280dbe30377f0))
* add build workflow ([890ebdb](https://github.com/Xerrion/auto-price-converter/commit/890ebdbe3304f2c1756aca0d4319f0f891c8ce07))
* add Chrome Web Store automated upload and manual publish workflows ([60a89e5](https://github.com/Xerrion/auto-price-converter/commit/60a89e5588f0fc2c7256ed9356eda8043554b32f))
* add import/export settings functionality ([#11](https://github.com/Xerrion/auto-price-converter/issues/11)) ([1f6bfd7](https://github.com/Xerrion/auto-price-converter/commit/1f6bfd7ab4f5cbe12845dd2d969ef9e9441c116a))
* add shadcn ([4eb9f6f](https://github.com/Xerrion/auto-price-converter/commit/4eb9f6f5158a3be84e3936c502432864cd04aeb6))
* add URL/domain exclusion list to disable conversion on specific sites ([#10](https://github.com/Xerrion/auto-price-converter/issues/10)) ([a21d00e](https://github.com/Xerrion/auto-price-converter/commit/a21d00efb2e356561d59303761b27a298b8896b7))
* configure Railway backend URL for production builds ([5b1ee99](https://github.com/Xerrion/auto-price-converter/commit/5b1ee9999ff110fef3ce7bd42eed42088c7af55a))
* display logo icon in popup and options UI ([#31](https://github.com/Xerrion/auto-price-converter/issues/31)) ([bb84d49](https://github.com/Xerrion/auto-price-converter/commit/bb84d49478b554505699265de78b8732335a6d17))
* **options:** add toast feedback ([b46317d](https://github.com/Xerrion/auto-price-converter/commit/b46317d70f1a29e422a01711b09ecacd5f42ed4c))
* **options:** add toast feedback ([6b12acf](https://github.com/Xerrion/auto-price-converter/commit/6b12acf57c062b87b54228424b044fee4951daa9))
* **ui:** add svelte sonner toaster ([3e2011d](https://github.com/Xerrion/auto-price-converter/commit/3e2011d287800940c260fa38bce88d6c0f1dcad4))
* **version:** add changelists to manage versioning ([0215343](https://github.com/Xerrion/auto-price-converter/commit/021534334bb9b22e1abdc7f7404b3fc1a12aefa7))
* **version:** add changelists to manage versioning ([1468c0b](https://github.com/Xerrion/auto-price-converter/commit/1468c0b002b135f1580ea1e3b0486f52a779857d))


### Bug Fixes

* **ci:** report commit status for pull_request_target events ([#25](https://github.com/Xerrion/auto-price-converter/issues/25)) ([8e9b1af](https://github.com/Xerrion/auto-price-converter/commit/8e9b1afe7e21f1de4323710fb9a49713e2e0d037))
* **ci:** trigger check job on changeset release PRs ([#24](https://github.com/Xerrion/auto-price-converter/issues/24)) ([990abd0](https://github.com/Xerrion/auto-price-converter/commit/990abd030fb6e5300e07cce4642c2100f64fb7ae))
* **formatter:** normalize Swiss thousands separator ([a3016dd](https://github.com/Xerrion/auto-price-converter/commit/a3016ddb9b9a66d8d151c784ba823e317b197b77))
* prevent false positives on large text blocks ([#9](https://github.com/Xerrion/auto-price-converter/issues/9)) ([9682eb7](https://github.com/Xerrion/auto-price-converter/commit/9682eb72977dafecf2016716e050725a14f9ba81))
* prevent matching product model numbers as prices ([52a8d0a](https://github.com/Xerrion/auto-price-converter/commit/52a8d0a4b3e1b879d8f3473294c1057c029358cf))
* separate Chrome Web Store publish from GitHub release workflow ([5264487](https://github.com/Xerrion/auto-price-converter/commit/5264487ca59eca543bc2c36dfda7ce610dc421ad))
* **storage:** normalize settings values ([33e1fd8](https://github.com/Xerrion/auto-price-converter/commit/33e1fd8cf02cde579d8c8e8d379c3084e513c7e2))
* TypeScript error in formatter ALL_CURRENCIES indexing ([a4d3111](https://github.com/Xerrion/auto-price-converter/commit/a4d3111381b816d8ff5958db56ddc544f6028d49))
* use CHANGELOG.md content for GitHub release notes ([8edc2ce](https://github.com/Xerrion/auto-price-converter/commit/8edc2cee4d68a3221f9f98f7c73ecc509cb963d1))
* use GitHub release artifact for Chrome Web Store publish ([c58f98f](https://github.com/Xerrion/auto-price-converter/commit/c58f98f909609427ff2076e2fabc533f371d5ae0))
* use jq instead of node for version extraction in tag-release workflow ([e69fc57](https://github.com/Xerrion/auto-price-converter/commit/e69fc576ccdb8e69d35b31c434618e249f1e2fcc))


### Code Refactoring

* consolidate currency detection constants to types.ts ([7dc9fa5](https://github.com/Xerrion/auto-price-converter/commit/7dc9fa50509a5160fc0a9a26a32006abd4bab176))
* **content:** restructure content script into submodules ([3b62393](https://github.com/Xerrion/auto-price-converter/commit/3b6239341b62139eced6e8d8fa26c2cebdd02038))
* **content:** split index.ts into focused modules ([1579bad](https://github.com/Xerrion/auto-price-converter/commit/1579bad9acbe59f45927ce2a2c6836e731c2dae3))
* optimize performance, bundle size, and code quality ([#8](https://github.com/Xerrion/auto-price-converter/issues/8)) ([56fc68a](https://github.com/Xerrion/auto-price-converter/commit/56fc68a952e1408bfbcd6634f9e6c32e559602c5))
* split options page into smaller card components ([#12](https://github.com/Xerrion/auto-price-converter/issues/12)) ([d2b8e2b](https://github.com/Xerrion/auto-price-converter/commit/d2b8e2b5449616b6868e396be779dd25140a7079))

## 2.2.0

### Minor Changes

- [#20](https://github.com/Xerrion/auto-price-converter/pull/20) [`0158349`](https://github.com/Xerrion/auto-price-converter/commit/0158349a25b8f2e07402d6e440d4a05f7eced367) Thanks [@Xerrion](https://github.com/Xerrion)! - Add support for 7 new currency symbols: NGN (₦), VND (₫), KZT (₸), BDT (৳), RUB (₽), GHS (GH₵), GEL (₾)

  New currencies can now be detected on e-commerce sites like Jumia (Nigeria, Ghana), Lazada (Vietnam), Kaspi (Kazakhstan), Daraz (Bangladesh), Yandex Market (Russia), and Wolt (Georgia).

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
