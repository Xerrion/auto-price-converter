---
"auto-price-converter": minor
---

Refactor options page into modular components and improve CI pipeline

- Split options page (521 lines) into 6 focused card components for better maintainability
- Extract currency helpers to `$lib/currency.ts` for reusability
- Consolidate CI workflows: faster PR checks (no build), build only on main push
- Release workflow now trusts CI checks instead of re-running them
