# Risuai — GitHub Copilot Context

> Full project reference: [AGENTS.md](../AGENTS.md)

## Stack

Svelte 5 (Runes) + TypeScript 5.9 + Vite 7 + Tailwind CSS 4 + Tauri 2.9 (Rust). Package manager: pnpm. Testing: Vitest + fast-check.

## Path Alias

`src` → `/src`. Use `import { x } from 'src/ts/...'` instead of deep relative paths.

## Key Files

- `src/ts/stores.svelte.ts` — Reactive state (DBState, selectedCharID, UI flags)
- `src/ts/storage/database.svelte.ts` — Data model (Database, character, Chat, Message)
- `src/ts/process/index.svelte.ts` — Chat pipeline (sendChat)
- `src/ts/process/request/` — API request handlers (OpenAI, Anthropic, Google)
- `src/ts/plugins/plugins.svelte.ts` — Plugin system manager
- `src/ts/globalApi.svelte.ts` — File I/O, fetch, asset utilities
- `src/ts/alert.ts` — Error/alert system (use alertError())
- `src/App.svelte` — Root component (conditional rendering, no router)
- `src/lang/index.ts` — i18n (import { language })

## Conventions

- File naming: `.svelte` (PascalCase components), `.svelte.ts` (camelCase reactive), `.ts` (camelCase logic)
- State: Svelte 5 Runes (`$state`, `$derived`, `$effect`, `$props`) for new code; legacy `writable()` stores also used
- Errors: `alertError()` from `src/ts/alert.ts` — never silent catches or console.log
- i18n: `language.xxx` for user-facing strings
- Tests: colocated `*.test.ts`, Vitest + fast-check
- TypeScript: `strict: false`, target ES2023
- Immutability preferred — new objects over mutation

## Commands

```bash
pnpm dev          # Dev server (port 5174)
pnpm check        # Type check
pnpm test         # Tests
pnpm build        # Production build
pnpm tauri dev    # Desktop dev
```
