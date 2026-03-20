# NovelPageNav API v3 Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current API 2.1 `NovelPageNav_Edit` plugin with an API 3.0 reader plugin that renders its own fullscreen reader UI inside the plugin iframe and reads chat data through `risuai` APIs instead of mutating the main app DOM.

**Architecture:** Keep the existing [plugins/NovelPageNav_Edit.js](/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit.js) as the behavior reference only. Build a new API 3 plugin alongside it first, using `registerSetting` and `registerButton` as entry points, `showContainer('fullscreen')` for the reader shell, `getCurrentCharacterIndex`/`getCurrentChatIndex`/`getChatFromIndex` for data loading, and plugin-owned DOM/CSS inside the iframe. Treat [plugins/themes/noveltheme/novelhtml.html](/Users/bliss/Documents/Risuai/plugins/themes/noveltheme/novelhtml.html) and [plugins/themes/noveltheme/novelcss.css](/Users/bliss/Documents/Risuai/plugins/themes/noveltheme/novelcss.css) as visual reference assets only, not as runtime templates.

**Tech Stack:** Plain JavaScript plugin script, Risuai Plugin API v3, sandbox iframe DOM, Vitest contract tests, `pnpm`.

---

## Assumptions

- The `noveltheme` file-name and `quote1`/`quote2` fixes are already done and verified.
- The v3 migration should follow the recommended iframe-owned UI path, not `getRootDocument()`-based main-DOM mutation.
- We want a safe cutover path, so the v3 plugin is built in a new file first and only replaces the old file after parity checks pass.

### Task 1: Create the API v3 plugin skeleton and source contract test

**Files:**
- Create: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.js`
- Create: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.test.ts`

**Step 1: Write the failing test**

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const src = readFileSync(new URL('./NovelPageNav_Edit_v3.js', import.meta.url), 'utf8')

describe('NovelPageNav v3 contract', () => {
  test('declares API 3.0 metadata and v3 entry points', () => {
    expect(src).toContain('//@api 3.0')
    expect(src).toContain('registerSetting(')
    expect(src).toContain('showContainer(\'fullscreen\')')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: FAIL because the new plugin file does not exist yet.

**Step 3: Write minimal implementation**

Create a minimal plugin shell:

```js
//@api 3.0
//@name 📖NovelPageNav_Edit
//@version 7.0.0

(async () => {
  try {
    await risuai.registerSetting('Novel Reader', async () => {
      try {
        await risuai.showContainer('fullscreen')
      } catch (error) {
        await risuai.log(`Novel reader open failed: ${error.message}`)
      }
    }, '📖', 'html')
  } catch (error) {
    await risuai.log(`Novel reader bootstrap failed: ${error.message}`)
  }
})()
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/NovelPageNav_Edit_v3.js plugins/NovelPageNav_Edit_v3.test.ts
git commit -m "feat: add NovelPageNav API v3 plugin skeleton"
```

### Task 2: Add reader data loading from v3 chat APIs

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.test.ts`

**Step 1: Write the failing test**

Extend the contract test so the plugin must use the chat APIs instead of scanning `.novel-viewer` nodes:

```ts
test('loads current reader data through v3 chat APIs', () => {
  expect(src).toContain('getCurrentCharacterIndex')
  expect(src).toContain('getCurrentChatIndex')
  expect(src).toContain('getChatFromIndex')
  expect(src).not.toContain('querySelectorAll(\'.novel-viewer\')')
  expect(src).not.toContain('mutationObs.observe(document.body')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: FAIL because the skeleton does not load any chat data yet.

**Step 3: Write minimal implementation**

Add a loader like:

```js
async function loadCurrentReaderContext(Risuai) {
  const characterIndex = await Risuai.getCurrentCharacterIndex()
  const chatIndex = await Risuai.getCurrentChatIndex()
  const character = await Risuai.getCharacterFromIndex(characterIndex)
  const chat = await Risuai.getChatFromIndex(characterIndex, chatIndex)

  return {
    characterIndex,
    chatIndex,
    character,
    chat,
    messages: chat?.message ?? []
  }
}
```

Only include messages that the reader should render. Keep filtering logic simple first: text messages only, newest selected chat only.
Wrap loader failures in `try/catch` and return a controlled empty/error state instead of letting the iframe open into a broken screen.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/NovelPageNav_Edit_v3.js plugins/NovelPageNav_Edit_v3.test.ts
git commit -m "feat: load reader data from v3 chat APIs"
```

### Task 3: Build the iframe-owned reader shell and port the visual structure

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.js`
- Reference only: `/Users/bliss/Documents/Risuai/plugins/themes/noveltheme/novelhtml.html`
- Reference only: `/Users/bliss/Documents/Risuai/plugins/themes/noveltheme/novelcss.css`
- Modify: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.test.ts`

**Step 1: Write the failing test**

Require the v3 plugin to own its reader markup in the iframe:

```ts
test('renders a plugin-owned reader shell', () => {
  expect(src).toContain('document.body.innerHTML')
  expect(src).toContain('novel-viewer')
  expect(src).toContain('novel-header')
  expect(src).toContain('novel-body')
  expect(src).toContain('hidden-controls')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: FAIL because the plugin still only opens an empty fullscreen container.

**Step 3: Write minimal implementation**

Inside the `registerSetting` callback:

- Render a plain HTML shell into `document.body`.
- Convert the theme reference to standard DOM nodes only.
- Do not use `risuicon`, `risutextbox`, `risubuttons`, or `risugeninfo` inside the iframe.
- Inline or inject CSS derived from `novelcss.css`, but remove all `.risu-chat` selectors.

Minimal shell example:

```js
document.body.innerHTML = `
  <div class="novel-viewer" data-theme="light">
    <div class="novel-header"><span class="to-label">From.</span><span class="to-name"></span></div>
    <div class="bookmark-container"><div class="bookmark-ribbon"><div class="bookmark-images"><div class="bookmark-portrait"></div></div></div></div>
    <div class="novel-body"><div class="novel-content"></div></div>
    <div class="hidden-controls"><div class="controls-left"></div><div class="controls-right"></div></div>
  </div>
`
```

If rendering fails, replace the container body with a small inline error panel and a close button instead of leaving a blank fullscreen iframe.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/NovelPageNav_Edit_v3.js plugins/NovelPageNav_Edit_v3.test.ts
git commit -m "feat: render NovelPageNav reader shell in iframe"
```

### Task 4: Implement text rendering and page navigation in the iframe

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.test.ts`

**Step 1: Write the failing test**

Require the presence of the new reader behaviors:

```ts
test('implements iframe page navigation without legacy window globals', () => {
  expect(src).toContain('function renderMessageContent')
  expect(src).toContain('function updatePageInfo')
  expect(src).toContain('function scrollToPage')
  expect(src).not.toContain('window._nvPageState')
  expect(src).not.toContain('window._nvWheelLocks')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: FAIL because pagination has not been rebuilt yet.

**Step 3: Write minimal implementation**

- Keep state in plain local variables inside the iframe session:
  - `currentPage`
  - `totalPages`
  - `themeId`
  - `fontId`
  - `showBookmark`
- Render chat text into `.novel-content` as sanitized HTML fragments or text blocks from the chat data.
- Rebuild:
  - page count calculation
  - prev/next/first/last buttons
  - wheel and touch navigation
  - mobile single-column mode
- Skip edit-mode support in the first green pass. The v3 reader should be read-only first.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/NovelPageNav_Edit_v3.js plugins/NovelPageNav_Edit_v3.test.ts
git commit -m "feat: add iframe pagination and reader navigation"
```

### Task 5: Migrate persisted settings to v3 storage APIs

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.test.ts`

**Step 1: Write the failing test**

Require explicit use of v3 storage:

```ts
test('stores reader settings through v3 storage APIs', () => {
  expect(src).toContain('getArgument(')
  expect(src).toContain('setArgument(')
  expect(src).toContain('pluginStorage')
  expect(src).not.toContain('localStorage.getItem(')
  expect(src).not.toContain('localStorage.setItem(')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: FAIL because persistence has not been migrated yet.

**Step 3: Write minimal implementation**

Storage split:

- `getArgument` / `setArgument`
  - `theme`
  - `font`
  - `bookmark`
- `pluginStorage`
  - custom color presets
  - custom font CSS
  - future reader presets tied to the save file

Add metadata args:

```js
//@arg theme string Reader theme
//@arg font string Reader font
//@arg bookmark string Bookmark visibility
```

Wrap reads and writes:

```js
const theme = (await Risuai.getArgument('theme')) || 'light'
await Risuai.setArgument('theme', 'dark')
await Risuai.pluginStorage.setItem('customColors', customColors)
```

Every storage read/write path must be wrapped in `try/catch`, with fallback defaults for reads and non-fatal logging for writes.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/NovelPageNav_Edit_v3.js plugins/NovelPageNav_Edit_v3.test.ts
git commit -m "feat: migrate NovelPageNav settings to v3 storage"
```

### Task 6: Add launch surfaces, close flow, and parity polish

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.test.ts`

**Step 1: Write the failing test**

Require the user entry points and close handling:

```ts
test('registers a launch button and close behavior', () => {
  expect(src).toContain('registerButton(')
  expect(src).toContain('hideContainer(')
  expect(src).toContain('close')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: FAIL because only settings-based launch exists.

**Step 3: Write minimal implementation**

- Register an action button with `location: 'chat'` or `location: 'action'`.
- Make both the setting entry and the button entry open the same `openReader()` flow.
- Add close button and `Escape` support.
- Reapply the remaining parity items from the old plugin only if they survive the iframe model cleanly:
  - theme dropdown
  - font dropdown
  - bookmark toggle
- Do not port legacy global cleanup machinery.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/NovelPageNav_Edit_v3.js plugins/NovelPageNav_Edit_v3.test.ts
git commit -m "feat: add NovelPageNav v3 launch surfaces and close flow"
```

### Task 7: Verify full migration, then cut over from the legacy file

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_v3.js`
- Replace or rename target: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit.js`
- Optional archive: `/Users/bliss/Documents/Risuai/plugins/NovelPageNav_Edit_legacy_2_1.js`

**Step 1: Write the failing test**

Add a final contract check that the shipping plugin is API 3:

```ts
const shippingSrc = readFileSync(new URL('./NovelPageNav_Edit.js', import.meta.url), 'utf8')

test('shipping plugin is API 3.0', () => {
  expect(shippingSrc).toContain('//@api 3.0')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: FAIL because the current shipping file is still the API 2.1 script.

**Step 3: Write minimal implementation**

- Rename or copy the new plugin into the shipping path.
- Archive the old script instead of deleting it immediately.
- Update metadata version from `7.0.0` to the agreed release version after final review.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts`

Expected: PASS.

**Step 5: Run full verification**

Run manual verification in the app:

1. Enable the API v3 plugin and confirm it registers a settings entry.
2. Open the reader from the settings entry and confirm `showContainer('fullscreen')` presents the iframe reader.
3. Open the reader from the registered button and confirm it routes to the same `openReader()` path.
4. Verify the currently selected character/chat is the one rendered in the reader.
5. Confirm desktop pagination works with click, wheel, and keyboard.
6. Confirm mobile layout uses the single-column reader path and still pages correctly with touch.
7. Change theme/font/bookmark options, close the reader, reopen it, and confirm persisted values are restored.
8. Trigger at least one failure path intentionally, such as opening with an empty chat, and confirm the plugin shows a controlled fallback state rather than a blank or broken iframe.

Expected: All checks pass without relying on main-document mutation or legacy `window._nv*` globals.

Run: `pnpm vitest run plugins/NovelPageNav_Edit_v3.test.ts plugins/themes/dogeared/theme.test.ts plugins/themes/jjamppong/customCSS.test.ts`

Expected: PASS.

Run: `pnpm check`

Expected: PASS or existing unrelated failures only. If unrelated failures exist, record them before cutover.

**Step 6: Commit**

```bash
git add plugins/NovelPageNav_Edit.js plugins/NovelPageNav_Edit_v3.js plugins/NovelPageNav_Edit_v3.test.ts
git commit -m "feat: migrate NovelPageNav plugin to API v3"
```

## Notes For Execution

- Do not attempt a literal search-and-replace migration of the 2.1 file. The current script depends on main-document mutation, `window`-scoped caches, mutation observers, and `localStorage`, which are the wrong primitives for v3.
- Prefer rebuilding small pieces in the iframe over porting compatibility shims.
- Avoid `getRootDocument()` unless a concrete reader requirement cannot be solved from chat data and iframe DOM alone.
- The old theme HTML is useful as a visual target, but the v3 reader must use normal HTML nodes, not chat-template-only tags.
- Use the `risuai` global object directly for v3 API access; do not add `Risuai` or legacy fallback entry points unless multi-version compatibility is an explicit goal.
- Wrap all async open/render/storage flows in `try/catch` and log failures, because the migration guide calls out async error handling as a v3 best practice.

## Definition Of Done

- Shipping plugin file declares `//@api 3.0`.
- Reader opens from a v3 setting and a v3 button.
- Reader loads current character/chat via `risuai` APIs.
- Page navigation works on desktop and mobile inside the iframe.
- Theme/font/bookmark settings persist through v3 storage APIs.
- No main-document mutation observer or `window._nv*` global state remains in the shipping plugin.

Plan complete and saved to `docs/plans/2026-03-12-novel-page-nav-v3.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
