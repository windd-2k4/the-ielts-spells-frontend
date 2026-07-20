# Repository Guidelines

## Project Structure & Module Organization

This repository is a pnpm workspace. Deployable applications live in `apps/`: `main-web` is a Next.js 16 public/student site using the App Router, while `management-web` is a React 19 application built with Vite. Shared workspace packages live in `packages/`: `ui` contains reusable React components, `design-tokens` owns theme CSS, `api-client` centralizes backend access, and `contracts` holds shared TypeScript types. Keep app-specific code under each app's `src/` directory and promote code to `packages/` only when multiple apps consume it. Static assets should stay with the app that owns them.

## Build, Test, and Development Commands

Use pnpm 11.9.0 and Node.js 24, matching CI.

- `pnpm install --frozen-lockfile` installs the exact workspace dependencies.
- `pnpm dev:main` starts the Next.js application locally.
- `pnpm dev:management` starts the Vite management application.
- `pnpm typecheck` runs TypeScript checks across all workspaces.
- `pnpm build` builds every package or app that defines a build script.
- `pnpm --filter @ielts/management-web preview` previews its production build.

Run `pnpm typecheck && pnpm build` before opening a pull request; these are the required CI checks.

## Coding Style & Naming Conventions

The codebase uses strict TypeScript, ES modules, and React functional components. Follow the existing two-space indentation, double quotes, and semicolon style. Name components and their files with PascalCase (for example, `CourseCard.tsx`), hooks with `useCamelCase`, and utilities with camelCase. Keep CSS selectors descriptive and reuse variables from `@ielts/design-tokens/theme.css`. No formatter or linter is configured, so preserve nearby formatting and rely on TypeScript for static validation.

## Testing Guidelines

No automated test framework or coverage threshold is configured yet. For every change, type-check and build the complete workspace, then manually exercise the affected app. If adding tests, colocate them with source as `*.test.ts` or `*.test.tsx`, add a workspace `test` script, and document the selected framework in the pull request.

## Commit & Pull Request Guidelines

The repository has no commit history from which to infer an established convention. Use short, imperative commit subjects, preferably Conventional Commit style, such as `feat(main-web): add course filters` or `fix(ui): preserve button focus`. Pull requests should explain the user-visible change, identify affected workspaces, link relevant issues, and list verification performed. Include before/after screenshots for visual changes and call out configuration or environment-variable additions.

## Security & Configuration

Copy `.env.example` into the relevant app's `.env.local`. Never commit secrets or real credentials; only public placeholders belong in the example file.
