# AGENTS.md — The IELTS Spells Frontend

This file is the operating contract for AI agents working in this repository. Read it before inspecting or changing code. The sibling backend repository is normally at `../the-ielts-spells-backend`; its `AGENTS.md` defines the matching server-side contract.

## 1. Repository and product facts

- This is a pnpm workspace using pnpm 11.9 and Node.js 24.
- `apps/main-web`: Next.js 16 App Router application for the public landing pages and student learning/test experience.
- `apps/management-web`: React 19 + Vite 7 management portal for Admin, Manager, Teacher, and Admissions. Local Vite port is `5174`.
- `packages/ui`: reusable UI primitives.
- `packages/design-tokens`: shared theme CSS and visual tokens.
- `packages/api-client`: shared backend transport/client code.
- `packages/contracts`: reusable TypeScript API contracts.
- Backend API: `http://localhost:8080/api/v1` by default. Authentication is Supabase Auth; business data comes from the Spring Boot API.

### Non-negotiable product decisions

- A course and teaching class are one aggregate in this product. Do not reintroduce a separate class menu, model, client, or route unless the user explicitly changes the domain decision.
- Each course contains one skill pair only: Listening + Reading or Speaking + Writing. Course UI, filters, progress, resources, and test assignment must respect that pair.
- Students can have multiple enrollments. Transfer, reservation/deferral, withdrawal, and reactivation are enrollment workflows, not destructive student edits.
- Management access is invitation based. Do not add open staff registration or social-login entry points to the management portal unless explicitly requested.
- Main web owns the student test-taking experience. Management web owns authoring, publishing, assignment, review, and operations.
- Reading Test Builder draft data and published test data are different states. Never treat a locally mocked builder document or draft JSON as a published runnable test.

## 2. Work safely in the existing repository

Before editing:

1. Read this file, the root `README.md`, `DESIGN.md`, the affected app/package files, and the sibling backend `AGENTS.md` for contract work.
2. Run `git status --short`. The worktree may contain user changes. Preserve them; do not reset, checkout, delete, broadly reformat, or overwrite unrelated work.
3. Use `rg` to find the existing route, component, API call, type, token, and state pattern before creating another one.
4. For a multi-page or cross-repository change, state a short plan and define the API/business contract first.
5. Preserve the established visual direction unless the user explicitly asks for a redesign.

Never use `git reset --hard`, `git checkout --`, broad recursive deletion, or generated-file cleanup that could remove user work. Never log or expose access tokens, JWTs, signed storage URLs, passwords, or server-only keys.

## 3. Application and package boundaries

- Keep route/page orchestration in the owning app.
- Keep reusable presentational primitives in `packages/ui`; do not move a component there until at least two apps genuinely need it.
- Keep shared colors, typography, spacing, and semantic CSS variables in `packages/design-tokens`.
- Put cross-app wire contracts in `packages/contracts`. Wire values must match backend enums exactly.
- Put cross-app transport behavior in `packages/api-client`. Existing app-specific calls may remain in `apps/management-web/src/lib/api.ts` while being migrated deliberately; do not create a second ad-hoc fetch wrapper for each feature.
- Feature components may own interaction state, but request/auth/error normalization belongs in the API layer.
- Avoid giant page files. Split by business feature, not arbitrary visual fragments. Keep forms, modals, tables, and test-builder panels cohesive.
- Use stable IDs from the API as React keys. Never use array indexes for reorderable questions, passages, files, or sessions.

## 4. Contract-first cross-repository workflow

For any real backend-backed feature, follow this sequence:

1. **Clarify the use case**: actor/role, preconditions, lifecycle transition, validation, failure cases, loading state, empty state, and success feedback.
2. **Inspect both sides**: current Spring controller/DTO/enum and current TypeScript type/call/component. Extend the existing contract instead of creating a parallel fake flow.
3. **Backend first when the wire contract changes**: migration/domain/use case/DTO/controller/security/tests/OpenAPI.
4. **Update TypeScript contracts and API client** before changing page components.
5. **Implement UI states**: loading, empty, populated, validation error, 401, 403, 404, 409/422, retryable provider/server failure, and disabled/submitting states.
6. **Verify both repositories** and smoke-test with a real token and real endpoint. Do not fall back to demo arrays when a request fails.

If only this repository is in scope and the backend is missing, implement an honest empty/error state and leave an exact backend handoff. Never silently invent API success.

### API and data conventions

- The API helper receives paths relative to `/api/v1`, for example `/admin/courses`; do not duplicate `/api/v1` in feature code.
- Use Supabase only for authentication/session and explicitly approved storage flows. All business CRUD goes through the backend.
- Never place `SUPABASE_SERVICE_ROLE_KEY` or another secret in a `VITE_*` or `NEXT_PUBLIC_*` variable.
- Use UUID strings and ISO-8601 date/time strings at the boundary. Format dates for Vietnamese display only in view helpers.
- Use the backend `PageResponse<T>` shape for paginated screens. Pagination, query, filters, and sort must be server-driven for non-trivial lists.
- Treat enum strings as closed unions. Do not scatter untyped string literals across components.
- Use the shared error message returned by the API when safe, then map status codes to actionable Vietnamese UI copy.
- A 401 may refresh the Supabase session once. A 403 is a permission problem and must not trigger a refresh loop.
- File upload uses `FormData`; do not set its `Content-Type` manually. Preview/download must use authenticated API helpers and object URLs must be revoked.
- Production screens use API data. Mock/fixture data is allowed only in tests, stories, or explicitly named development fixtures and must never be an automatic runtime fallback.

## 5. Design and UX standards

- `DESIGN.md` is authoritative for brand direction. Preserve the calm, professional IELTS mentor aesthetic, pink/gray palette, Outfit typography, and current information hierarchy.
- Reuse `@ielts/design-tokens/theme.css` variables and existing Tailwind/CSS conventions. Do not add random hex values when an equivalent semantic token exists.
- Preserve good existing layouts while wiring real data. “Replace fake data” does not authorize replacing the design.
- Use Phosphor icons consistently; do not mix icon families or emoji as functional icons.
- Inputs, buttons, dialogs, tables, tabs, and focus states must remain keyboard accessible. Dialogs need focus management, Escape/close behavior, labelled controls, and scroll locking.
- Every async action needs visible progress and double-submit protection. Destructive actions require confirmation and explain their business impact.
- Do not hide missing data with plausible values. Show `—`, “Chưa có dữ liệu”, or a task-specific empty state.
- Responsive behavior is required. Dense management tables may use a deliberate horizontal-scroll container, sticky identifier/actions, and an accessible mobile alternative.
- Keep user-visible Vietnamese concise and consistent. Do not expose raw enum names, Java exceptions, HTTP internals, or provider errors.

## 6. Feature-specific invariants

### Authentication and roles

- Management routes require an activated staff account and the appropriate authority.
- Hiding a button is not authorization; backend `@PreAuthorize` remains mandatory.
- Route guards and action guards must distinguish `admin`, `manager`, `teacher`, and `admissions` consistently with backend authorities.
- On logout or unauthorized-account exit, clear the Supabase session and return to the login route without trapping the user on an access-denied page.

### Reading Test Builder

- Draft hierarchy is Test → Passage → Question Group → Question → Option/Answer/Explanation.
- Full IELTS Reading defaults to three passages, 40 questions, and 60 minutes. Practice/placement variants may differ and must be represented explicitly, not inferred from missing data.
- The split-screen workspace uses independent scrolling, stable passage/group/question IDs, debounced autosave with visible status, and server version/conflict handling.
- Question numbers are derived from ordered groups/questions. Reordering must update order atomically and must not use array indexes as identity.
- Shared option banks belong to a question group for matching/headings tasks; do not duplicate them into each question.
- Publish is a server command. The client displays validation issues returned by the backend and cannot mark a draft published locally.
- Preview renders the persisted draft/published payload through the same presentation model intended for main web.

### Courses, students, attendance, and content

- Course detail remains the unified workspace for overview, schedule, students, attendance, progress, activity matrix, and course library.
- Enrollment actions must call real lifecycle endpoints; do not delete a student profile to remove one enrollment.
- Attendance renders the course enrollment roster consistently for every session, including unmarked late enrollees.
- Learning resources, media, and exercise templates have explicit global/course scope, publish/visibility status, skill/category metadata, and authenticated file access.

## 7. Coding, commands, and verification

- Strict TypeScript, ES modules, React functional components, two-space indentation, double quotes, semicolons. Match nearby style.
- Components/files use PascalCase, hooks `useCamelCase`, utilities camelCase, and contracts descriptive domain names.
- Do not suppress type errors with `any`, `@ts-ignore`, or unsafe casts when a correct contract can be modeled.
- Do not add a dependency without checking whether the workspace already provides the capability and explaining the bundle/maintenance cost.

Commands:

- `pnpm install --frozen-lockfile` — install exact dependencies.
- `pnpm dev:main` — start main web.
- `pnpm dev:management` — start management web at port 5174.
- `pnpm typecheck` — type-check all workspaces.
- `pnpm build` — build all workspaces with build scripts.
- `pnpm --filter @ielts/management-web typecheck` — focused management check.
- `pnpm --filter @ielts/management-web build` — focused management production build.
- `pnpm --filter @ielts/management-web preview` — preview the management build.

No automated frontend test framework is currently required by the workspace. When adding one, colocate `*.test.ts(x)`, add a workspace script, and document the framework. Until then, type-check, build, and manually smoke-test the affected real flow.

Minimum verification:

| Change | Required verification |
| --- | --- |
| Documentation only | Inspect diff; `git diff --check` |
| Shared contract/package | `pnpm typecheck` and `pnpm build` |
| Management page/component | Focused typecheck/build, then workspace typecheck/build and browser smoke test |
| Main/student test flow | Main build + browser smoke test for start, answer persistence, submit, and result |
| API contract change | Backend `mvn verify` + frontend typecheck/build + real endpoint smoke test |
| Visual redesign | Above checks + responsive and keyboard review + before/after screenshots |

## 8. Definition of done and handoff

A frontend task is complete only when:

- The page uses real API data and real mutations, with no fake runtime fallback.
- Role, loading, empty, error, validation, submitting, success, and destructive-confirmation states are intentional.
- Visual design remains consistent with `DESIGN.md` and existing polished screens.
- Contracts match backend paths, DTO fields, pagination, enums, and error statuses.
- Required checks passed, or the exact failing command and cause are reported.
- New public environment variables are documented in `.env.example` with safe placeholders.

Final handoff must list:

1. changed user flow and key files;
2. new/changed routes, API calls, contracts, roles, and environment variables;
3. commands actually run and their results;
4. backend synchronization completed or still required;
5. manual scenarios tested, screenshots for visual work, and known limitations.

Use concise Conventional Commit subjects such as `feat(management): add reading question groups` or `fix(api-client): preserve forbidden response`. Keep unrelated changes separate.
