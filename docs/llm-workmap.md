# Risuai LLM Workmap

This document is optimized for fast task entry by a new LLM agent.

## Read This First

- Do not assume a change is isolated to a single Svelte component.
- Check whether the feature is persisted in `DBState.db`.
- Check whether it affects prompt assembly, request formatting, plugin hooks, or Tauri behavior.

## Fast Task Routing

### If the task is chat UI or message rendering

Open first:

- `src/lib/ChatScreens/ChatScreen.svelte`
- `src/lib/ChatScreens/DefaultChatScreen.svelte`
- `src/lib/ChatScreens/Chat.svelte`
- `src/lib/ChatScreens/Message.svelte`
- `src/ts/stores.svelte.ts`

Also inspect if needed:

- `src/ts/parser`
- `src/ts/process/index.svelte.ts`

### If the task is settings UI or a new toggle/option

Open first:

- `src/ts/storage/database.svelte.ts`
- `src/ts/setting/settingRegistry.ts`
- `src/ts/setting/*`
- `src/lib/Setting/Settings.svelte`
- `src/lib/Setting/Pages/*`

Typical change pattern:

1. Add or confirm DB field
2. Register setting metadata
3. Render or wire the setting page
4. Confirm the runtime code actually reads the field

### If the task is chat behavior, prompting, or generation flow

Open first:

- `src/ts/process/index.svelte.ts`
- `src/ts/process/request/request.ts`
- `src/ts/process/templates/*`
- `src/ts/process/lorebook.svelte.ts`
- `src/ts/process/scripts.ts`

Also inspect:

- `src/ts/process/group.ts`
- `src/ts/process/triggers.ts`
- `src/ts/process/files/*`
- `src/ts/process/memory/*`

### If the task is provider/model integration

Open first:

- `src/ts/model/modellist.ts`
- `src/ts/model/types.ts`
- `src/ts/model/providers/*`
- `src/ts/process/request/*`

Check all of these before concluding a provider bug:

- model flags
- prompt reformatting
- provider request body
- response parsing
- fallback logic

### If the task is plugins or custom providers

Open first:

- `src/ts/plugins/plugins.svelte.ts`
- `src/ts/plugins/pluginSafety.ts`
- `src/ts/plugins/apiV3/*`
- `plugins.md`

Likely impact areas:

- plugin metadata parsing
- safety/sandbox checks
- request replacers
- custom provider registration

### If the task is lorebook or memory

Open first:

- `src/ts/process/lorebook.svelte.ts`
- `src/ts/process/memory/hypamemory.ts`
- `src/ts/process/memory/hypav2.ts`
- `src/ts/process/memory/hypav3.ts`
- `src/ts/process/memory/supaMemory.ts`
- `src/ts/process/memory/hanuraiMemory.ts`

Be careful:

- There are multiple memory systems
- Different DB flags may switch behavior
- The active path may vary by character, preset, or global config

### If the task is character import/export or card data

Open first:

- `src/ts/characterCards.ts`
- `src/ts/storage/database.svelte.ts`
- `src/ts/storage/risuSave.ts`
- `src/App.svelte` drag-and-drop handlers

### If the task is desktop-only or native integration

Open first:

- `src-tauri/src/main.rs`
- `src/ts/platform.ts`
- `src/ts/globalApi.svelte.ts`
- `src/ts/bootstrap.ts`

Confirm whether the feature is:

- Tauri-only
- web-only
- dual-path with environment branching

### If the task is self-host/server behavior

Open first:

- `server/node/server.cjs`
- `server/node/readme.md`
- `server/hono/README.md`
- `server/hono/src/*`

## High-Risk Areas

### `src/ts/storage/database.svelte.ts`

This is both schema and runtime helper territory.

Risks:

- save compatibility
- default values
- downstream assumptions in UI and process code

### `src/ts/process/index.svelte.ts`

This is the chat pipeline hub.

Risks:

- regressions in prompt assembly
- token or stage accounting issues
- group chat side effects
- memory/triggers/plugins interacting in unexpected order

### `src/ts/process/request/request.ts`

This is where provider dispatch becomes real.

Risks:

- fallback loops
- streaming edge cases
- plugin replacer interference
- provider formatting mismatches

### `src/ts/stores.svelte.ts`

Global state wiring can create broad UI side effects.

Risks:

- stale assumptions about selected character/chat
- reactive side effects
- mobile/desktop mode changes

## Common Change Recipes

### Add a new persistent setting

1. Add the field to `Database`
2. Confirm default initialization path
3. Register the setting UI metadata
4. Render it in the appropriate settings page
5. Wire the runtime consumer
6. Run typecheck

### Add a new chat feature

1. Find where the user triggers it in `src/lib/ChatScreens`
2. Find whether it needs a DB field or only transient store state
3. Trace into `sendChat()` or adjacent process modules if it changes generation behavior
4. Verify group chat, memory, and plugin interaction assumptions

### Add or fix a provider feature

1. Confirm provider metadata in `modellist.ts`
2. Confirm formatting/reformatting behavior
3. Confirm request body generation
4. Confirm response parsing and streaming handling
5. Verify fallback logic does not hide the real issue

## Verification Commands

Run at minimum:

```bash
pnpm check
pnpm test
```

Useful during manual exploration:

```bash
pnpm dev
pnpm tauri dev
```

If a change is scoped and tests are sparse, at least run `pnpm check` and explain what was not verified.

## Practical Rules For New LLM Sessions

- Read `docs/overview.md` before making architectural assumptions.
- Search for existing DB fields before adding new ones.
- Search both UI files and `src/ts/process` before deciding where behavior lives.
- When touching prompt or request code, inspect model flags and plugin hooks.
- When touching persistence, think about old save compatibility.
- When touching desktop code, verify web behavior still has a valid path.

## Minimum Context Set For Most Tasks

If you only have time to read a few files, start here:

- `src/main.ts`
- `src/App.svelte`
- `src/ts/bootstrap.ts`
- `src/ts/stores.svelte.ts`
- `src/ts/storage/database.svelte.ts`
- `src/ts/process/index.svelte.ts`
- `src/ts/process/request/request.ts`

That set is usually enough to avoid the worst mistaken assumptions.
