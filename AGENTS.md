# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Spring Boot (Java 17) REST/WebSocket API. Code in `src/main/java`, tests in `src/test/java`, build outputs in `build/`.
- `frontend/`: Vite + React + TypeScript UI. App code in `src/`, static assets in `public/`.
- `runner/`: Node/TypeScript Playwright runner service. Sources in `src/`, compiled to `dist/`.
- `docs/`: Additional documentation (see `docs/PROJECT_STRUCTURE.md`).

## Build, Test, and Development Commands
- Backend
  - `cd backend && ./gradlew bootRun`: Start API locally (H2 by default).
  - `./gradlew test jacocoTestReport`: Run JUnit tests + coverage (HTML at `backend/build/jacocoHtml`).
  - `./gradlew build`: Build fat JAR.
- Frontend
  - `cd frontend && npm ci`: Install deps.
  - `npm run dev`: Start Vite dev server.
  - `npm run build`: Production build to `frontend/dist`.
  - `npm test`: Run Vitest.
- Runner
  - `cd runner && npm ci`: Install deps.
  - `npm run install-browsers`: Install Playwright browsers.
  - `npm run dev` | `npm run build && npm start`: Dev or prod server.

## Coding Style & Naming Conventions
- Java: 4-space indent; package `com.example.apitest`. Classes PascalCase; `*Controller`, `*Service`, `*Repository` suffixes. Prefer constructor injection.
- TypeScript/React: 2-space indent; components PascalCase; hooks/utilities camelCase; files `FeatureName.tsx` or `useThing.ts`.
- Lint/Format: `frontend` and `runner` include ESLint (`npm run lint`). Keep imports ordered; avoid unused exports.

## Testing Guidelines
- Backend: JUnit 5, Mockito, AssertJ. Coverage enforced via JaCoCo (min 5%); aim higher for core modules. Place tests under mirroring packages in `src/test/java`.
- Frontend: Vitest + Testing Library; name `*.test.ts(x)`. Prefer DOM queries by role/text.
- Runner: Jest for unit tests; Playwright for E2E flows where relevant.

## Commit & Pull Request Guidelines
- Commits: Use short, imperative subjects with a prefix. Examples: `feat: add pipeline filter`, `fix: handle 401 on relogin`, `mod: optimize frontend build`.
- PRs: Provide summary, rationale, and scope; link issues; include screenshots for UI changes; note backend API impacts; add/adjust tests; ensure `build` and `test` pass across modules.

## Security & Configuration
- Do not commit secrets/tokens (`.env*`, cookies). Use example files and local overrides.
- For publishing, backend uses `NEXUS_USERNAME`/`NEXUS_PASSWORD` if configured—set via environment, not VCS.
