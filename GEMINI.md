# Risuai — Gemini Context

> Full project reference: [AGENTS.md](./AGENTS.md)

## Quick Reference

- **Stack**: Svelte 5 (Runes) + TypeScript 5.9 + Vite 7 + Tailwind CSS 4 + Tauri 2.9
- **Package Manager**: pnpm
- **Path Alias**: `src` → `/src` (use `import { x } from 'src/ts/...'`)
- **State**: `$state()` / `$derived()` / `$effect()` (Svelte 5 Runes) + `writable()` stores
- **No strict TS**: `strict: false` in tsconfig

## Essential Commands

```bash
pnpm dev          # Dev server (port 5174)
pnpm check        # Type check — run after every change
pnpm test         # Vitest tests
pnpm build        # Production build
pnpm tauri dev    # Desktop dev
```

## Key Files (Start Here)

| File | What It Does |
|------|-------------|
| `src/ts/stores.svelte.ts` | All reactive state (DBState, selectedCharID, UI flags) |
| `src/ts/storage/database.svelte.ts` | Data model — Database, character, Chat, Message types |
| `src/ts/process/index.svelte.ts` | Chat pipeline — sendChat() orchestration |
| `src/ts/process/request/` | API calls to OpenAI/Claude/Gemini |
| `src/ts/plugins/plugins.svelte.ts` | Plugin system manager |
| `src/ts/globalApi.svelte.ts` | File I/O, fetch, asset utilities |
| `src/ts/alert.ts` | Error/alert system — use alertError() |
| `src/App.svelte` | Root component (conditional rendering, no router) |
| `src/lang/index.ts` | i18n — import { language } |

## Rules

- **Read first, edit second** — always read the file before modifying
- **Match existing style** — follow the patterns already in the file
- **Imports**: use `src/` alias, not deep relative paths
- **Errors**: use `alertError()`, never silent catch or console.log
- **i18n**: use `language.xxx` for user-facing strings
- **New components**: Svelte 5 Runes (`$props()`, `$state()`, `$derived()`)
- **Run `pnpm check`** after TypeScript changes
- **Tests**: colocate as `*.test.ts` next to source, use Vitest + fast-check
- **No mutation** — prefer spread/new objects over in-place modification

## Directory Structure

```
src/ts/          → Business logic (storage, process, plugins, model)
src/lib/         → Svelte UI components (ChatScreens, Setting, UI, Mobile)
src/lang/        → i18n translations
src-tauri/       → Rust desktop backend
server/          → Self-hosting servers (Node.js, Hono)
plugins/         → Plugin source files
```

For detailed architecture, data models, and patterns, see [AGENTS.md](./AGENTS.md).
