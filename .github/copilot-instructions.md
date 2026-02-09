# Copilot instructions

## Project overview

- Browser extension (Chrome & Firefox) built with Svelte 5 + TypeScript
- Bundled with WXT (Web Extension Tools)
- Uses Bun for scripts in this repo

## Code style

- Prefer existing patterns in `src/` and avoid large refactors
- Keep changes minimal and focused
- Use TypeScript types explicitly when useful
- Keep functions small and testable

## Testing

- `bun test` for watch mode
- `bun run test:run` for CI-like run
- `bun run check` for Svelte/type checks

## Pull requests

- Update docs when behavior changes
- Add or update tests when it makes sense
- Keep PRs narrow and well-scoped

## MUST DO
- ALWAYS use `bun` as package manager
