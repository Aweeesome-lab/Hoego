# Repository Guidelines

## Project Structure & Module Organization
OTRA splits the web overlay under `src/` and the Rust host under `src-tauri/`. A single HTML entry (`index.html`) loads `src/entry.ts`, which dynamically boots either the overlay (`src/main.tsx`) or the history view (`src/history.ts`). Paired styles live in `src/styles/`. Rust commands and tray setup sit in `src-tauri/src/main.rs`; packaging assets live beside `tauri.conf.json` and `icons/`. History markdown lands in `~/Documents/OTRA/history` for local inspection.

## Build, Test & Development Commands
- `npm run dev`: Launches the Tauri dev server with hot reload for both the web overlay and Rust side.
- `npm run build`: Produces a distributable desktop bundle via `tauri build`, outputting artifacts under `src-tauri/target/release/`.
- `cargo test --manifest-path src-tauri/Cargo.toml`: Runs backend unit tests; add scenarios here when expanding command logic.
- `cargo fmt --manifest-path src-tauri/Cargo.toml`: Formats Rust sources before review; ensure no diff appears afterward.

## Coding Style & Naming Conventions
Frontend modules use ES modules, two-space indentation, camelCase helpers, and kebab-case DOM ids to match existing markup. Rust relies on `rustfmt` defaults: snake_case functions, UpperCamelCase types, `?` for error flow, and concise log prefixes such as `[otra]`.

## Testing Guidelines
Automated frontend tests are not yet in place; favor targeted Rust unit tests and integration checks around new commands. Name tests after the behavior (`history_merge_handles_duplicates`) and document manual UI smoke steps or recordings in the pull request when changing overlay behavior.

## Commit & Pull Request Guidelines
Write commit subjects in the imperative mood with an optional scope, e.g., `overlay: trim empty entries`. Squash incidental fixups locally so each commit remains reviewable and reversible. Pull requests should summarize user-facing impact, link issues, provide macOS notes for shortcut or permission changes, and attach screenshots or GIFs for UI adjustments.

## Platform & Configuration Tips
macOS builds request Accessibility permission for global shortcuts; if prompts fail, grant access via System Settings → Privacy & Security → Accessibility. When adjusting persistence, update both the JavaScript `STORAGE_KEYS` map and the Rust `history_directory_path()` helper to keep storage paths aligned.
