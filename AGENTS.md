# Repository Guidelines

## Project Structure & Module Organization
- App is a SvelteKit project. Frontend source lives in `src/` (routes, components, stores, utils). Static assets are in `static/`.
- Multiplayer WebSocket server runs from `server/index.js`; systemd points here on the VPS.
- Tests: unit tests under `src/lib/utils/__tests__/`; Playwright e2e tests in `tests/`.
- Build output is emitted to `build/` via the static adapter; screenshots live in `screenshots/`.

## Build, Test, and Development Commands
- Install deps: `pnpm install --frozen-lockfile`
- Dev server: `pnpm dev`
- Build for production: `pnpm run build`
- Preview built app: `pnpm preview`
- Unit tests (Vitest): `pnpm test:unit`
- E2E tests (Playwright): `pnpm test:e2e` (requires browsers installed)
- Lint/format check: `pnpm lint`; auto-format: `pnpm format`
- Multiplayer server (local): `pnpm run server` (uses `server/index.js`)

## Coding Style & Naming Conventions
- Use TypeScript and Svelte 4; prefer explicit types on exports and public APIs.
- Formatting via Prettier (+ Svelte/Tailwind plugins); linting via ESLint. Run `pnpm format` before commits.
- Components are PascalCase (`MyComponent.svelte`); stores/utilities are camelCase; constants in `constants/`.
- Keep components small; co-locate styles and logic inside `.svelte` files. Use Tailwind utility classes.

## Testing Guidelines
- Unit tests with Vitest live beside the code in `__tests__/`. Name files `*.test.ts`.
- Prefer deterministic tests; avoid network calls. Use fixtures/mocks for randomness.
- Run `pnpm test:unit` before pushing; add Playwright e2e for UI regressions when changing flows.

## Commit & Pull Request Guidelines
- Commit messages: short imperative summary (e.g., `Add admin panel auth`, `Fix bet timing`).
- Include all relevant code, tests, and updated snapshots before pushing.
- PRs should describe intent, list major changes, and note testing performed; add screenshots for UI changes when feasible.

## Security & Configuration Tips
- Multiplayer URL is set via `VITE_MULTIPLAYER_WS_URL`; server password via `ADMIN_PASSWORD` (defaults to `canEggAI`). Avoid committing secrets.
- On the VPS, systemd unit `plinko-ws.service` should point to `/opt/plinko-server/server/index.js` and the correct Node path; reload (`systemctl daemon-reload`) after edits.
