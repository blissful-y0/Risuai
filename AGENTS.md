# Risuai — AI Assistant Context

> This file is the canonical project reference for all AI coding assistants.
> Other files (CLAUDE.md, GEMINI.md, .cursorrules, .github/copilot-instructions.md) reference this file.

## Project Overview

Risuai is a cross-platform AI chatting application built with:
- **Frontend**: Svelte 5 (Runes) + TypeScript 5.9
- **Desktop**: Tauri 2.9 (Rust backend)
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Package Manager**: pnpm
- **Testing**: Vitest + fast-check (property-based)

Users chat with various AI models (OpenAI, Claude, Gemini, etc.) through a unified interface with themes, plugins, custom assets, and advanced memory systems.

## Directory Structure

```
risuai/
├── src/                       # Main application source
│   ├── ts/                    # TypeScript business logic
│   ├── lib/                   # Svelte UI components
│   ├── lang/                  # i18n (en, ko, cn, zh-Hant, vi, de, es)
│   └── App.svelte             # Root component (conditional rendering, no router)
├── src-tauri/                 # Tauri desktop backend (Rust)
├── server/
│   ├── node/                  # Express.js self-hosting server
│   └── hono/                  # Hono server (in development)
├── plugins/                   # Plugin source files (.js)
├── public/                    # Static assets
└── .github/workflows/         # CI/CD
```

### `/src/ts` — Business Logic

| Path | Purpose |
|------|---------|
| `storage/database.svelte.ts` | **Central data model** — Database, character, Chat, Message interfaces |
| `stores.svelte.ts` | **Reactive state** — DBState, selectedCharID, UI stores |
| `process/index.svelte.ts` | **Chat pipeline** — sendChat() orchestration |
| `process/request/` | API request handlers (openAI.ts, anthropic.ts, google.ts) |
| `process/memory/` | Memory systems (hypav3.ts, hypav2.ts, supaMemory.ts) |
| `process/models/` | Provider integrations (NAI, OpenRouter, Ooba, Ollama) |
| `process/templates/` | Prompt templates and formatting |
| `process/mcp/` | Model Context Protocol support |
| `process/lorebook.svelte.ts` | Lorebook/world info management |
| `process/scriptings.ts` | Regex-based output transformation |
| `process/triggers.ts` | Event-based automation |
| `process/stableDiff.ts` | Stable Diffusion integration |
| `process/tts.ts` | Text-to-speech |
| `plugins/plugins.svelte.ts` | Plugin system (API v3.0, sandboxing) |
| `characterCards.ts` | Character card import/export |
| `cbs.ts` | Callback/event system |
| `globalApi.svelte.ts` | Utility functions (file I/O, fetch, assets) |
| `bootstrap.ts` | App initialization |
| `parser.svelte.ts` | Message parsing, markdown, DOMPurify |
| `gui/` | Color scheme, highlight, animations |
| `model/modellist.ts` | Model registry |
| `drive/` | Cloud sync & backup |
| `translator/` | Translation system |

### `/src/lib` — UI Components

| Path | Purpose |
|------|---------|
| `ChatScreens/` | Chat interface (Chat.svelte, ChatScreen.svelte, Message.svelte) |
| `UI/GUI/` | Classic GUI components |
| `UI/NewGUI/` | New GUI system |
| `UI/Realm/` | Realm popup system |
| `Setting/` | Settings panels (BotSettings.svelte, Pages/*) |
| `SideBars/` | Sidebar (Scripts, LoreBook) |
| `Mobile/` | Mobile-specific UI |
| `VisualNovel/` | Visual novel mode |
| `LiteUI/` | Lightweight UI variant |
| `Others/` | Alerts, catalogs, pro tools |

## Commands

```bash
pnpm dev              # Web dev server (port 5174)
pnpm tauri dev        # Tauri desktop dev
pnpm build            # Web production build (with sourcemap)
pnpm buildsite        # Web build for hosting
pnpm tauribuild       # Vite build for Tauri
pnpm tauri build      # Full Tauri desktop build
pnpm check            # Svelte/TypeScript type checking
pnpm test             # Run Vitest tests
pnpm hono:build       # Hono server build
pnpm runserver        # Node.js self-hosting server
```

## Coding Conventions

### File Naming

| Extension | Usage | Example |
|-----------|-------|---------|
| `.svelte` | UI components | `Chat.svelte`, `Message.svelte` |
| `.svelte.ts` | Reactive TS with runes ($state, $effect) | `stores.svelte.ts`, `plugins.svelte.ts` |
| `.ts` | Pure TypeScript logic | `util.ts`, `alert.ts` |
| `.cjs` | CommonJS (Node server) | `server.cjs` |

- Components: **PascalCase** (`ChatScreen.svelte`)
- Logic files: **camelCase** (`globalApi.svelte.ts`)

### Imports

```typescript
// Use absolute 'src/' alias (configured in vite.config.ts)
import { DBState } from 'src/ts/stores.svelte'
import { language } from 'src/lang'
import type { OpenAIChat } from 'src/ts/process/index.svelte'

// Order: third-party → internal → types
import { get, writable } from 'svelte/store'
import { downloadFile } from '../globalApi.svelte'
import type { character } from '../storage/database.svelte'
```

### State Management

The project uses **both** Svelte 5 Runes and legacy Svelte stores:

```typescript
// Svelte 5 Runes — preferred for new code
export const DBState = $state({ db: {} as Database })
export const LoadingStatusState = $state({ text: '' })

// Legacy stores — still used widely
export const selectedCharID = writable(-1)
export const settingsOpen = writable(false)

// Access store value synchronously
import { get } from 'svelte/store'
const charId = get(selectedCharID)
```

### Component Pattern (Svelte 5)

```svelte
<script lang="ts">
    interface Props {
        message?: string
        name?: string
        isLastMemory: boolean
    }

    let { message = $bindable(''), name = '', isLastMemory }: Props = $props()

    let localState = $state(false)
    let computed = $derived(message.length > 0)

    $effect(() => {
        // reactive side effects
    })
</script>

<div class="flex items-center gap-2">
    {#if computed}
        <span>{message}</span>
    {/if}
</div>
```

### Error Handling

```typescript
import { alertError } from 'src/ts/alert'

// Use alertError() — never swallow errors
try {
    const result = await riskyOperation()
} catch (error) {
    alertError(error)  // Shows UI alert with stack trace
    return false
}

// In chat pipeline: errors can be inlined as chat messages
// when db.inlayErrorResponse is enabled
```

### i18n

```typescript
import { language } from 'src/lang'

// Access translation keys as properties
alertError(language.errors.toomuchtoken)
const label = language.addCharacter

// Language switching: merge over English base
// Files: src/lang/en.ts (base), ko.ts, cn.ts, etc.
```

### Placeholder System

```typescript
// Common placeholders in prompts/messages
{{char}}  → character name
{{user}}  → user name
{{getvar::key}}  → get variable
{{setvar::key::value}}  → set variable
```

## Core Data Model

```typescript
// src/ts/storage/database.svelte.ts
interface Database {
    characters: character[]
    apiType: string
    openAIKey: string
    mainPrompt: string
    jailbreak: string
    temperature: number
    maxContext: number
    maxResponse: number
    botPresets: BotPreset[]
    plugins: RisuPlugin[]
    // ... 100+ properties
}

interface character {
    chaId: string
    name: string
    type: 'normal' | 'group'
    chats: Chat[]
    lorebooks: loreBook[]
    customscript: customscript[]
    emotionImages: { [key: string]: string[] }
    // ...
}

interface Chat {
    message: Message[]
    date: number
    modules?: string[]
}

interface Message {
    role: 'user' | 'char' | 'system'
    data: string
    time: number
    saying?: string
    generationInfo?: MessageGenerationInfo
}
```

### Data Access

```typescript
import { DBState } from 'src/ts/stores.svelte'
import { getDatabase, setDatabase } from 'src/ts/storage/database.svelte'

// Read
const db = getDatabase()     // or DBState.db
const char = db.characters[selectedId]

// Write — changes auto-persist through storage layer
// setDatabase() validates with checkNullish() and sets defaults
```

## Chat Processing Pipeline

```
User Input
  → sendChat() in process/index.svelte.ts
    → Template formatting (process/templates/)
    → Lorebook injection (process/lorebook.svelte.ts)
    → Memory system (process/memory/)
    → Token calculation
    → API request (process/request/)
    → Response streaming
    → Post-processing (scriptings, triggers)
  → Message displayed
```

### API Request Interface

```typescript
interface OpenAIChat {
    role: 'system' | 'user' | 'assistant' | 'function'
    content: string
    memo?: string
    multimodals?: MultiModal[]
    thoughts?: string[]
    cachePoint?: boolean
}

interface requestDataArgument {
    formated: OpenAIChat[]
    bias: { [key: number]: number }
    currentChar?: character
    temperature?: number
    maxTokens?: number
}
```

## Plugin System (API v3.0)

- Sandboxed execution with AST-based safety checks (`acorn` parser)
- **Forbidden**: `eval()`, `new Function()`, `sessionStorage`, global object access
- **Sanitized**: `window`, `global`, `globalThis` → `safeGlobalThis`
- Plugin metadata via comment directives: `//@name`, `//@api`, `//@display-name`
- Hot reload support for development
- Plugin storage: save-specific and device-specific scopes

## Storage Backends

| Platform | Backend |
|----------|---------|
| Tauri Desktop | File system (`AppData/database/database.bin`) |
| Web | IndexedDB via localforage |
| Node Server | File system with directory structure |

- Save format: Binary (risuSave encoding) with optional encryption
- Character cards: `.risum`, `.risup`, `.charx` formats

## Testing

```bash
pnpm test             # Vitest runner
pnpm check            # Type checking
```

- Framework: **Vitest** with **fast-check** for property-based tests
- DOM simulation: **happy-dom**
- Tests colocated with source: `**/*.test.ts`
- Mocking with `vi.mock()`

```typescript
import { expect, test, vi } from 'vitest'
import fc from 'fast-check'

vi.mock(import('../../storage/database.svelte'), () => ({
    appVer: '1234.5.67',
    getCurrentCharacter: () => ({}),
}))

test('property test example', () => {
    fc.assert(fc.property(fc.string(), (s) => {
        expect(typeof s).toBe('string')
    }))
})
```

## Build Configuration

- **vite.config.ts**: Svelte 5 + Tailwind CSS 4 + WASM support
- **tsconfig.json**: `strict: false`, target ES2023, module ES2022, bundler resolution
- **Path alias**: `src` → `/src`
- Production: debug code stripped via `@rollup/plugin-strip`
- Chunk size warning: 2000KB

## Supported AI Providers

OpenAI, Anthropic (Claude), Google (Gemini), DeepInfra, OpenRouter, AI Horde, Ollama, Ooba, NovelAI, DeepSeek, WebLLM, custom providers via plugins

## Deployment Targets

- **Web**: Vite static site
- **Desktop**: Windows (NSIS), macOS (DMG), Linux (DEB/RPM/AppImage)
- **Docker**: Container (port 6001)
- **Self-hosted**: Node.js or Hono server

## Security

- Plugin sandboxing with iframe isolation + AST analysis
- DOM sanitization with DOMPurify
- Buffer encryption/decryption for save files
- CORS handling with proxy support
- Tauri HTTP plugin for native fetch (bypasses CORS)

## Key Guidelines for AI Assistants

1. **Read before edit** — Always read the target file before modifying
2. **Follow existing patterns** — Match the style of surrounding code
3. **Use `src/` alias** for imports, not relative paths from deep nesting
4. **Svelte 5 Runes** — Use `$state`, `$derived`, `$effect`, `$props()` for new code
5. **Error handling** — Use `alertError()` from `src/ts/alert.ts`, never silent catches
6. **i18n** — Use `language.xxx` keys for user-facing strings
7. **Type checking** — Run `pnpm check` after changes
8. **No console.log** in production code
9. **Immutability** — Prefer creating new objects over mutation
10. **Test colocated** — Place tests next to source as `*.test.ts`
