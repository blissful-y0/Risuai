# Chat Manuscript Studio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a new API v3 plugin that opens from the chat-side button into the current character workspace, lets users browse that character's sessions, read full sessions in a novel-style fullscreen reader, save per-session manuscript metadata, and export one or more sessions as a polished Markdown manuscript.

**Architecture:** Create a brand-new plugin at `plugins/ChatManuscriptStudio.js` using the RisuAI API v3 iframe workflow. Keep all UI inside the plugin iframe, use current-character chat APIs to load session data, open directly into the current character workspace, store editorial state in `pluginStorage`, and keep a test harness inside the plugin source so pure normalization and export helpers can be verified with Vitest without introducing a separate build step.

**Tech Stack:** Plain JavaScript plugin script, RisuAI Plugin API v3, plugin iframe DOM, `pluginStorage`, Vitest, `pnpm`.

---

## Assumptions

- The public plugin name is still undecided. The working file and internal metadata will use `ChatManuscriptStudio` for now and can be renamed before release.
- This is a plugin-only product. No main-app Svelte or storage schema changes are part of this plan.
- Current-character and session listing must come from RisuAI API data, not main DOM scraping.
- Markdown download will use iframe-side `Blob` + `<a download>` and must provide a copy-to-clipboard or manual copy fallback if download is blocked.
- The reader must support full-session reading without rendering the entire session DOM at once. Long-session performance work is in scope for v1, not an afterthought.

### Task 1: Create the new plugin skeleton, test harness, and source contract test

**Files:**
- Create: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.js`
- Create: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.test.ts`

**Step 1: Write the failing test**

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const src = readFileSync(new URL('./ChatManuscriptStudio.js', import.meta.url), 'utf8')

describe('ChatManuscriptStudio source contract', () => {
  test('declares API v3 metadata and fullscreen entry points', () => {
    expect(src).toContain('//@api 3.0')
    expect(src).toContain('registerSetting(')
    expect(src).toContain('registerButton(')
    expect(src).toContain('showContainer(\'fullscreen\')')
  })

  test('exposes test helpers only through the explicit test hook', () => {
    expect(src).toContain('__RISU_PLUGIN_TEST__')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: FAIL because the plugin file does not exist yet.

**Step 3: Write minimal implementation**

Create a minimal plugin shell:

```js
//@name ChatManuscriptStudio
//@display-name Chat Manuscript Studio
//@api 3.0
//@version 0.1.0

const testExports = {}
if (globalThis.__RISU_PLUGIN_TEST__) {
  globalThis.__RISU_PLUGIN_TEST__.ChatManuscriptStudio = testExports
}

(async () => {
  try {
    await risuai.registerSetting('Chat Manuscript Studio', async () => {
      await risuai.showContainer('fullscreen')
    }, '📚', 'html')

    await risuai.registerButton({
      name: 'Chat Manuscript Studio',
      icon: '📚',
      iconType: 'html',
      location: 'chat'
    }, async () => {
      await risuai.showContainer('fullscreen')
    })
  } catch (error) {
    await risuai.log(`ChatManuscriptStudio bootstrap failed: ${error.message}`)
  }
})()
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/ChatManuscriptStudio.js plugins/ChatManuscriptStudio.test.ts
git commit -m "feat: add ChatManuscriptStudio plugin skeleton"
```

### Task 2: Add current-character and session loading through v3 data APIs

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.test.ts`

**Step 1: Write the failing test**

```ts
test('loads character and session context through chat APIs instead of DOM scanning', () => {
  expect(src).toContain('getCurrentCharacterIndex')
  expect(src).toContain('getCurrentChatIndex')
  expect(src).toContain('getCharacterFromIndex')
  expect(src).toContain('getChatFromIndex')
  expect(src).not.toContain('document.querySelector(\'.risu-chat')
  expect(src).not.toContain('localStorage.getItem(')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: FAIL because the skeleton does not load any chat data.

**Step 3: Write minimal implementation**

Add data loaders such as:

```js
async function loadCurrentCharacterSummary(api) {
  const characterIndex = await api.getCurrentCharacterIndex()
  const chatIndex = await api.getCurrentChatIndex()
  const character = await api.getCharacterFromIndex(characterIndex)
  const currentChat = await api.getChatFromIndex(characterIndex, chatIndex)
  return { characterIndex, chatIndex, character, currentChat }
}
```

Then add:

- `loadCharacterSessions(api, characterIndex)` for the current character
- UI state wiring that opens directly into the current character workspace
- a lightweight initial state builder that does not scan the full save file

Wrap every async loader in `try/catch`, return empty states instead of throwing through the UI, and log failures.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/ChatManuscriptStudio.js plugins/ChatManuscriptStudio.test.ts
git commit -m "feat: load characters and sessions for manuscript workspace"
```

### Task 3: Build the fullscreen iframe shell and navigation views

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.test.ts`
- Reference only: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Reference only: `/Users/bliss/Documents/Risuai/plugins/themes/noveltheme/novelcss.css`

**Step 1: Write the failing test**

```ts
test('renders a plugin-owned manuscript workspace shell', () => {
  expect(src).toContain('document.body.innerHTML')
  expect(src).toContain('cms-character-shelf')
  expect(src).toContain('cms-session-browser')
  expect(src).toContain('cms-reader-view')
  expect(src).toContain('cms-export-view')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: FAIL because the plugin only opens an empty container.

**Step 3: Write minimal implementation**

Render a plugin-owned shell into the iframe with four sections:

- current character panel
- session browser
- reader view
- export view

The initial visible state after opening from the chat button must be:

- fullscreen container open
- current character workspace rendered
- current character session list loaded if possible

Use a novel-reader visual language inspired by `EbookReader.js`, but build all HTML/CSS directly in the plugin iframe.

Minimal skeleton:

```js
document.body.innerHTML = `
  <div class="cms-app">
    <aside class="cms-character-shelf"></aside>
    <section class="cms-session-browser"></section>
    <section class="cms-reader-view"></section>
    <section class="cms-export-view"></section>
  </div>
`
```

Include a simple empty state and an error state with a close button.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/ChatManuscriptStudio.js plugins/ChatManuscriptStudio.test.ts
git commit -m "feat: render manuscript workspace iframe shell"
```

### Task 4: Implement weak automatic normalization and temporary title generation

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.test.ts`
- Reference only: `/Users/bliss/Documents/Risuai/plugins/chat novel viewer v.1.1 fixed.js`

**Step 1: Write the failing test**

Add a runtime test that executes pure helpers through the plugin test hook:

```ts
test('normalizes session text conservatively and generates temporary titles', async () => {
  const api = loadPluginForTest()
  expect(api.normalizeSessionText('<b>hello</b>\\n\\n\\nworld')).toContain('hello')
  expect(api.normalizeSessionText('<b>hello</b>\\n\\n\\nworld')).not.toContain('<b>')
  expect(api.buildTemporaryTitle({
    messages: [{ role: 'char', data: '비가 오는 밤이었다. 너는 문 앞에 서 있었다.' }]
  })).toBeTruthy()
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: FAIL because the helpers do not exist yet.

**Step 3: Write minimal implementation**

Add pure helpers for:

- `cleanMarkupNoise(text)`
- `normalizeSessionMessages(messages, characterName)`
- `buildTemporaryTitle(sessionLike)`

Rules for first pass:

- strip obvious HTML noise
- preserve paragraph boundaries conservatively
- remove obvious empty/status junk only when pattern matching is reliable
- do not rewrite semantics
- build a temporary title from the first meaningful line, clipped to a short safe length

Expose these helpers through the `__RISU_PLUGIN_TEST__` hook only.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/ChatManuscriptStudio.js plugins/ChatManuscriptStudio.test.ts
git commit -m "feat: add session normalization and title generation helpers"
```

### Task 5: Add pluginStorage-backed manuscript library state

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.test.ts`

**Step 1: Write the failing test**

```ts
test('stores manuscript metadata and reader state in pluginStorage', () => {
  expect(src).toContain('pluginStorage.getItem(')
  expect(src).toContain('pluginStorage.setItem(')
  expect(src).not.toContain('localStorage.setItem(')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: FAIL because no storage paths are implemented yet.

**Step 3: Write minimal implementation**

Add storage helpers for:

- `library.sessions`
- `library.exports`
- `reader.preferences`

Store:

- edited session title
- session tags
- saved manuscript snapshot
- bookmark page
- export selection state
- reader typography/theme preferences

Keep session editorial metadata and work export metadata in separate shapes so session tags/title do not overwrite work-level tags/title during export composition.

Every read/write must use `try/catch` with safe fallback values.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/ChatManuscriptStudio.js plugins/ChatManuscriptStudio.test.ts
git commit -m "feat: persist manuscript library state in pluginStorage"
```

### Task 6: Implement the novel reader and per-session manuscript editing surface

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.test.ts`
- Reference only: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`

**Step 1: Write the failing test**

```ts
test('implements reader controls and metadata editing hooks', () => {
  expect(src).toContain('function renderReader')
  expect(src).toContain('function updatePageInfo')
  expect(src).toContain('function saveSessionManuscript')
  expect(src).toContain('data-action="bookmark"')
  expect(src).toContain('data-action="save-session"')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: FAIL because the reader is not interactive yet.

**Step 3: Write minimal implementation**

Rebuild reader features inside the plugin iframe:

- page splitting and page navigation
- bookmark button
- metadata drawer or inline form for title/tags/notes
- save session manuscript button
- desktop two-page mode and mobile single-page mode
- incremental pagination for long sessions
- render only the active page window instead of the entire session DOM
- background page-index construction after first paint

Use the existing v3 `EbookReader.js` as the reference for fullscreen reader interaction patterns, but keep the new UI namespaced to `cms-*`.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/ChatManuscriptStudio.js plugins/ChatManuscriptStudio.test.ts
git commit -m "feat: add manuscript reader and per-session editing"
```

### Task 7: Implement export project composition and Markdown generation

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.test.ts`

**Step 1: Write the failing test**

```ts
test('builds release-style markdown from multiple selected sessions', async () => {
  const api = loadPluginForTest()
  const md = api.composeMarkdownExport({
    title: 'Work Title',
    author: 'Pen Name',
    characterName: 'Character Name',
    sessions: [
      { title: '첫 만남', manuscript: '본문 A' },
      { title: '비 오는 날', manuscript: '본문 B' }
    ]
  })

  expect(md).toContain('title: "Work Title"')
  expect(md).toContain('# Work Title')
  expect(md).toContain('## Session 1. 첫 만남')
  expect(md).toContain('## Session 2. 비 오는 날')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: FAIL because export composition does not exist yet.

**Step 3: Write minimal implementation**

Add pure helpers:

- `composeMarkdownExport(exportProject)`
- `serializeFrontMatter(meta)`

Support:

- front matter by default
- work title
- author
- character name
- export date
- tags
- ordered multi-session sections

Compose export from the full normalized session text even if the reader UI only paginates and renders a smaller active window.

Do not add HTML-heavy markdown. Keep output plain and editor-friendly.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/ChatManuscriptStudio.js plugins/ChatManuscriptStudio.test.ts
git commit -m "feat: add markdown manuscript composition"
```

### Task 8: Implement export download and fallback copy flow

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.test.ts`

**Step 1: Write the failing test**

```ts
test('includes browser download and fallback copy flow for exports', () => {
  expect(src).toContain('new Blob(')
  expect(src).toContain('URL.createObjectURL(')
  expect(src).toContain('a.download =')
  expect(src).toContain('navigator.clipboard')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: FAIL because export delivery is not implemented yet.

**Step 3: Write minimal implementation**

Add:

- `downloadMarkdownFile(name, content)`
- `copyMarkdownFallback(content)`

Flow:

- try Blob + object URL + anchor download
- on failure, show copyable preview and use clipboard when available

Include a visible user-facing fallback message when direct download fails.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/ChatManuscriptStudio.js plugins/ChatManuscriptStudio.test.ts
git commit -m "feat: add markdown export delivery flow"
```

### Task 9: Final verification, metadata cleanup, and release readiness pass

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/ChatManuscriptStudio.test.ts`
- Reference only: `/Users/bliss/Documents/Risuai/docs/plans/2026-03-13-chat-manuscript-studio-design.md`

**Step 1: Write the final verification checklist**

Verify the following:

- chat button opens the fullscreen workspace
- current character workspace opens
- session list loads for the current character
- one session opens into the reader
- the reader can continue from the beginning to the end of a long session
- long sessions do not render as one giant DOM tree
- title edits persist
- bookmark persists
- multi-session selection persists
- Markdown preview is composed correctly
- download works or fallback copy path works

**Step 2: Run tests**

Run: `pnpm vitest run plugins/ChatManuscriptStudio.test.ts`

Expected: PASS.

**Step 3: Run type and repo checks**

Run: `pnpm check`

Expected: `svelte-check found 0 errors and 0 warnings`

**Step 4: Manual verification**

In the app:

1. Import the plugin.
2. Open it from the settings entry.
3. Open it from the chat button.
4. Confirm it opens straight into the current character workspace.
5. Browse that character’s sessions.
6. Open at least one session and read it in fullscreen.
7. Verify a long session opens without freezing the UI and can still be read from the first page to the last page.
8. Edit the temporary title and save it.
9. Add at least two sessions to export.
10. Generate Markdown.
11. Verify direct download works. If it does not, verify preview + copy fallback works.

**Step 5: Commit**

```bash
git add plugins/ChatManuscriptStudio.js plugins/ChatManuscriptStudio.test.ts
git commit -m "feat: ship ChatManuscriptStudio manuscript workspace"
```

## Notes For Execution

- Keep the first implementation conservative. Do not add LLM rewriting, EPUB export, or cross-character anthology support.
- Resist the urge to reuse `chat novel viewer` DOM code directly. Reuse heuristics only.
- If character or session enumeration through the available APIs is weaker than expected, stop and document the exact data shape before continuing. Do not silently fall back to main DOM scraping.
- If direct download proves environment-sensitive, preserve the export feature by shipping the fallback copy flow instead of blocking the whole release.
