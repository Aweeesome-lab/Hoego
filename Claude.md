# Claude Agent Guide

## @AGENTS.md

## Mandatory Reference

- Read `AGENTS.md` before making changes; treat it as the source of truth for layout, commands, and review policies.
- Keep the split between the web overlay in `src/` and the Rust host in `src-tauri/` intact, and route any platform-specific tweaks through the existing Tauri command surface.

## Collaboration Baseline

- Use the documented commands (`npm run dev`, `npm run build`, `cargo test`, `cargo fmt`) when verifying work; do not introduce alternative build steps.
- Match the established naming and formatting conventions (two-space indentation in the frontend, camelCase helpers, kebab-case DOM ids, `rustfmt` defaults on the backend) so diffs stay reviewable.
- Follow the commit guidance from `AGENTS.md`: imperative subjects, scoped prefixes when helpful, and squash incidental fixups before opening a pull request.

## HTML Hygiene

- Avoid introducing unnecessary HTML—`index.html` should remain the minimal shell that only mounts `src/entry.ts` and loads required assets.
- Prefer React components and TypeScript utilities over raw DOM fragments; only touch static HTML files when a browser capability absolutely cannot be expressed inside `src/`.
- When HTML changes are unavoidable, document the rationale in the pull request and ensure there are no stray elements, duplicate wrappers, or inline styles that belong in `src/styles/`.

## UI Best Practices Inside `src/`

- Keep UI composition inside React/TS modules (`src/App.tsx`, `src/components/`, `src/history.ts`, `src/main.tsx`) and let `entry.ts` continue to choose between overlay and history views dynamically.
- Co-locate view-specific styles in `src/styles/` or scoped CSS modules, and reuse shared tokens/utilities instead of sprinkling ad-hoc classes.
- Lean on small, focused components under `src/components/`, lift shared logic into hooks or helpers inside `src/lib/`, and keep stateful side effects close to their owners.
- Respect accessibility and overlay constraints: prefer semantic elements, trap focus when the overlay is active, and keep layouts responsive so the desktop overlay does not overflow.
- Keep assets in `src/assets/`, import SVG/PNG through Vite rather than hardcoding URLs, and gate experimental UI behind feature flags or settings in `src/settings.tsx` when appropriate.

## Verification & Handoff

- Run the relevant dev server or build before handing off changes, and call out any manual UI smoke steps in the pull request when touching overlay behavior.
- Note macOS accessibility permission expectations whenever updates could affect shortcuts or global key handling, mirroring the platform guidance from `AGENTS.md`.
