# Ebook Reader Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone API v3 ebook reader plugin that opens the current chat session in a fullscreen novel-style reader.

**Architecture:** Use the existing `plugins/EbookReader.js` codebase as the prototype base, but treat it as a productized ebook reader rather than a v2 pager migration. Keep the UI entirely inside the plugin iframe, load only the current chat through API v3 chat APIs, store user-facing reader preferences in `argument` and `pluginStorage`, and keep main-DOM access limited to illustration popover fallback.

**Tech Stack:** Plain JavaScript plugin script, RisuAI Plugin API v3, iframe DOM, `pluginStorage`, Vitest, `pnpm`.

---

## Assumptions

- The current prototype file is the implementation base: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`.
- Shipping copy is `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`.
- The v2 inline pager remains separate and is not part of this implementation.
- This plan does not rename the plugin yet. It stabilizes behavior first.

## Progress Notes

- 2026-03-13: Task 1 landed. The plugin now presents itself as `Ebook Reader` in the v3 prototype and shipping copy, and the explicit close label reads `이 리더 닫기`.
- 2026-03-13: Task 2 behavior is also present in the current prototype. Failed current-chat loads now route into a plugin-owned error view instead of continuing shell rendering.
- 2026-03-13: The current prototype already contains the planned reader shell, isolated page-navigation helpers, and root popover fallback. The shipping copy matches the prototype byte-for-byte.
- 2026-03-13 verification:
  - `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`
  - `node --check plugins/EbookReader.js`
  - `node --check plugins/EbookReader.js`
- Remaining manual work:
  - Open the plugin in-app and confirm fullscreen reader launch from chat/action entries.
  - Confirm settings dropdown, custom theme overlay, and close controls behave correctly.
  - Confirm illustration popover fallback still centers correctly after granting `mainDom`.

### Task 1: Rename the product surface inside the plugin without changing the file name yet

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`

**Step 1: Write the failing test**

Add source assertions that the user-facing copy is ebook-reader oriented:

```ts
test('presents the plugin as an ebook-style reader product', () => {
  expect(src).toContain('Ebook Reader')
  expect(src).toContain('close-reader-label')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

Expected: FAIL because the current strings still reflect the old naming.

**Step 3: Write minimal implementation**

Update user-visible strings only:

- settings label
- action button label
- failure copy if needed
- explicit close label wording if needed

Do not rename files yet.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/EbookReader.js plugins/EbookReader.js plugins/EbookReader.test.ts
git commit -m "feat: present v3 reader as ebook reader"
```

### Task 2: Stabilize current-chat loading and empty/error states

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`

**Step 1: Write the failing test**

Add source assertions:

```ts
test('loads the current chat and handles failure in plugin-owned views', () => {
  expect(src).toContain('getCurrentCharacterIndex')
  expect(src).toContain('getCurrentChatIndex')
  expect(src).toContain('getChatFromIndex')
  expect(src).toContain('renderErrorState')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

Expected: FAIL if the assertions are not already all present.

**Step 3: Write minimal implementation**

Refine:

- current context loading
- empty session rendering
- plugin-owned error rendering
- close path from empty/error screens

Keep the scope to one current session.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/EbookReader.js plugins/EbookReader.js plugins/EbookReader.test.ts
git commit -m "feat: harden ebook reader context loading"
```

### Task 3: Polish the reader shell into a coherent ebook experience

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`
- Reference only: `/Users/bliss/Documents/Risuai/plugins/themes/noveltheme/novelcss.css`

**Step 1: Write the failing test**

Add assertions for the reader shell:

```ts
test('renders the ebook shell with reader controls and settings UI', () => {
  expect(src).toContain('novel-page-nav-mobile')
  expect(src).toContain('nv-theme-dropdown')
  expect(src).toContain('nv-picker-overlay')
  expect(src).toContain('data-action="close"')
  expect(src).toContain('data-action="close-reader-label"')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

Expected: FAIL if any shell pieces are missing or renamed.

**Step 3: Write minimal implementation**

Refine the iframe UI:

- compact top-right nav bar
- explicit top-left close button
- page indicator
- theme dropdown
- font dropdown
- custom theme overlay
- custom font CSS area
- bookmark image toggle

Preserve the current “read like a book” feel. Do not add library or browsing features.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/EbookReader.js plugins/EbookReader.js plugins/EbookReader.test.ts
git commit -m "feat: polish ebook reader shell"
```

### Task 4: Verify page navigation behavior stays isolated from legacy v2 globals

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`
- Reference only: `/Users/bliss/Documents/Risuai/plugins/themes/noveltheme/NovelPageNav_v2.js`

**Step 1: Write the failing test**

Add assertions:

```ts
test('keeps page navigation plugin-owned and free of legacy window globals', () => {
  expect(src).toContain('function updatePageInfo')
  expect(src).toContain('function scrollToPage')
  expect(src).not.toContain('window._nvPageState')
  expect(src).not.toContain('mutationObs.observe(document.body')
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

Expected: FAIL if the current source regressed toward legacy behavior.

**Step 3: Write minimal implementation**

Adjust the page-navigation helpers only if needed:

- update total page calculation
- preserve desktop/mobile behavior split
- preserve keyboard/wheel/touch behavior
- keep state inside the reader session object

Do not reintroduce root-DOM readers or legacy `window` state.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/EbookReader.js plugins/EbookReader.js plugins/EbookReader.test.ts
git commit -m "feat: stabilize ebook page navigation"
```

### Task 5: Keep illustration-module popovers usable in the fullscreen reader

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`

**Step 1: Write the failing test**

Add assertions:

```ts
test('injects root popover fallback before opening fullscreen', () => {
  expect(src).toContain("requestPluginPermission('mainDom')")
  expect(src).toContain('getRootDocument()')
  expect(src).toContain('.lb-xnai-menu:popover-open')
  expect(src.indexOf('await ensureRootPopoverFallback(api)')).toBeLessThan(src.indexOf("await api.showContainer('fullscreen')"))
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

Expected: FAIL if the ordering or fallback contract regressed.

**Step 3: Write minimal implementation**

Keep or refine:

- root permission request
- root document style injection
- centered fallback style for supported popovers
- non-blocking behavior when permission is denied

Do not let this block basic reader open.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

Expected: PASS.

**Step 5: Commit**

```bash
git add plugins/EbookReader.js plugins/EbookReader.js plugins/EbookReader.test.ts
git commit -m "fix: preserve illustration popover fallback in ebook reader"
```

### Task 6: Manual verification pass in the live app

**Files:**
- No source edits required unless bugs are found.

**Step 1: Write the failing test**

No automated test. This task is manual verification only.

**Step 2: Run verification scenarios**

Run these scenarios in the app:

1. Open the reader from settings.
2. Open the reader from chat/action button.
3. Confirm current chat loads as pages.
4. Change theme.
5. Change font.
6. Open the custom color picker.
7. Toggle bookmark image visibility.
8. Close with the top-left close button.
9. Close with the compact nav close button.
10. Trigger the illustration module popover and confirm the fallback remains visible.

Expected: All flows work without depending on main chat DOM patching.

**Step 3: If bugs are found, return to the relevant task**

Do not patch multiple problems at once. Return to the matching task, add the failing contract test first where possible, then implement minimally.

**Step 4: Commit**

```bash
git add plugins/EbookReader.js plugins/EbookReader.js plugins/EbookReader.test.ts
git commit -m "chore: verify ebook reader flows"
```

Plan complete and saved to `docs/plans/2026-03-13-ebook-reader.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
