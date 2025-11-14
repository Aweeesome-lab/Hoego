# Development Guide

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests in watch mode
npm run test:watch
```

## 📦 Available Scripts

### Development

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Tauri development server (recommended) |
| `npm run dev:vite` | Start Vite dev server only (frontend only) |
| `npm run preview` | Preview production build locally |

### Building

| Script | Description |
|--------|-------------|
| `npm run build` | Build production bundle with Tauri |
| `npm run build:vite` | Build frontend only with Vite |

### Testing

| Script | Description |
|--------|-------------|
| `npm test` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI for interactive testing |
| `npm run test:run` | Run tests once (CI mode) |
| `npm run test:coverage` | Generate test coverage report |
| `npm run test:watch` | Run tests in watch mode (alias) |

### Code Quality

| Script | Description |
|--------|-------------|
| `npm run lint` | Check for ESLint errors |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run type-check` | TypeScript type checking |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run check` | Run all checks (type, lint, format) |
| `npm run check:fix` | Run all checks and auto-fix |

### Rust Commands

| Script | Description |
|--------|-------------|
| `npm run rust:check` | Check Rust code compilation |
| `npm run rust:clippy` | Run Clippy linter (strict mode) |
| `npm run rust:fmt` | Format Rust code |
| `npm run rust:fmt:check` | Check Rust code formatting |
| `npm run rust:test` | Run Rust tests |

### Maintenance

| Script | Description |
|--------|-------------|
| `npm run clean` | Remove build artifacts and cache |
| `npm run clean:all` | Remove all build artifacts and node_modules |
| `npm run validate` | Run full validation (all checks + tests) |

## 🛠️ Development Workflow

### Before Starting Work

```bash
# Pull latest changes
git pull

# Install/update dependencies
npm install

# Check everything works
npm run validate
```

### During Development

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Run tests in watch mode
npm run test:watch

# Terminal 3: Type checking
npm run type-check -- --watch
```

### Before Committing

```bash
# Run all checks and auto-fix
npm run check:fix

# Run tests
npm run test:run

# Validate Rust code
npm run rust:check
npm run rust:clippy
```

## 🏗️ Project Structure

```
hoego/
├── src/                      # Frontend source
│   ├── components/          # React components
│   │   ├── layout/         # Layout components (Header, Footer)
│   │   ├── panels/         # Panel components (DumpPanel, AiPanel, etc.)
│   │   ├── markdown/       # Markdown renderer components
│   │   └── ai/             # AI-related components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   │   ├── tauri.ts       # Tauri API wrapper
│   │   └── services/      # Service layer
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   └── test/               # Test utilities and setup
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs        # Main entry point
│   │   ├── history.rs     # History management
│   │   ├── ai_summary.rs  # AI summary functionality
│   │   ├── window_manager.rs # Window management
│   │   ├── shortcuts.rs   # Global shortcuts
│   │   ├── tray.rs        # System tray
│   │   └── utils.rs       # Shared utilities
│   └── Cargo.toml
├── .claude/                # Claude Code configuration
│   └── docs/              # Refactoring documentation
└── docs/                   # Project documentation
```

## 🧪 Testing Strategy

### Test Organization

- **Unit Tests**: `src/**/*.test.{ts,tsx}`
- **Component Tests**: `src/components/**/*.test.tsx`
- **Hook Tests**: `src/hooks/**/*.test.ts`
- **Service Tests**: `src/lib/services/**/*.test.ts`

### Running Specific Tests

```bash
# Run tests for a specific file
npm test -- src/hooks/useTheme.test.ts

# Run tests matching a pattern
npm test -- --grep "theme"

# Run with coverage for specific file
npm run test:coverage -- src/hooks/useTheme.test.ts
```

## 🎨 Code Style

### TypeScript/React

- **Strict Mode**: Enabled in `tsconfig.json`
- **ESLint**: Configured with TypeScript, React, and accessibility rules
- **Prettier**: Auto-formatting on save (if using VS Code)

### Rust

- **Format**: Run `cargo fmt` before committing
- **Linting**: Run `cargo clippy` to catch common mistakes
- **Tracing**: Use `tracing` crate for logging (not `println!`)

## 🔧 IDE Setup (VS Code)

### Recommended Extensions

Install these extensions for the best development experience:

- `esbenp.prettier-vscode` - Code formatter
- `dbaeumer.vscode-eslint` - ESLint integration
- `bradlc.vscode-tailwindcss` - Tailwind CSS IntelliSense
- `vitest.explorer` - Vitest test runner
- `tauri-apps.tauri-vscode` - Tauri development tools
- `rust-lang.rust-analyzer` - Rust language support

### Auto-configured Settings

The project includes `.vscode/settings.json` with:

- Format on save (Prettier)
- ESLint auto-fix on save
- TypeScript workspace configuration
- Recommended formatter per file type

## 🐛 Debugging

### Frontend Debugging

```bash
# Run with browser DevTools
npm run dev

# Then press F12 or right-click → Inspect
```

### Rust Debugging

```bash
# Run with Rust logging
RUST_LOG=debug npm run dev

# Or specific module
RUST_LOG=hoego::history=trace npm run dev
```

### Test Debugging

```bash
# Run tests with UI
npm run test:ui

# Debug specific test file
npm test -- --inspect-brk src/hooks/useTheme.test.ts
```

## 📋 Common Tasks

### Adding a New Component

1. Create component file: `src/components/[category]/ComponentName.tsx`
2. Export from index: `src/components/[category]/index.ts`
3. Create test file: `src/components/[category]/ComponentName.test.tsx`
4. Use `React.memo` if needed for performance

### Adding a New Hook

1. Create hook file: `src/hooks/useHookName.ts`
2. Export from index: `src/hooks/index.ts`
3. Create test file: `src/hooks/useHookName.test.ts`
4. Add to store if it manages global state

### Adding a Tauri Command

1. Add Rust function in `src-tauri/src/`
2. Add to command list in `main.rs`
3. Define TypeScript types in `src/types/tauri-commands.ts`
4. Update `src/lib/tauri.ts` wrapper
5. Add tests for both Rust and TypeScript

## 🔍 Troubleshooting

### Build Issues

```bash
# Clean everything and reinstall
npm run clean:all
npm install
cd src-tauri && cargo clean && cd ..
npm run build
```

### Type Errors

```bash
# Check TypeScript errors
npm run type-check

# Restart TypeScript server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Test Failures

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run single test file
npm test -- src/path/to/test.ts

# Clear test cache
npm test -- --clearCache
```

## 📚 Additional Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Rust Book](https://doc.rust-lang.org/book/)

## 🤝 Contributing

Before submitting a PR:

1. Run `npm run validate` (all checks + tests)
2. Ensure test coverage for new features
3. Update documentation if needed
4. Follow the commit message format
5. Check that build succeeds

## 📝 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Run validation before pushing
npm run validate

# Push to remote
git push origin feature/your-feature
```

## 🎯 Performance Optimization

### Frontend

- Use `React.memo` for expensive components
- Lazy load heavy components with `React.lazy`
- Use `useMemo` and `useCallback` for expensive computations
- Monitor bundle size with `npm run build:vite`

### Rust

- Profile with `cargo flamegraph`
- Check binary size with `cargo bloat`
- Use `--release` for performance testing
- Enable LTO in production builds

## 🔐 Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Review Tauri allowlist in `tauri.conf.json`
- Keep dependencies updated: `npm audit`
- Check Rust vulnerabilities: `cargo audit`
