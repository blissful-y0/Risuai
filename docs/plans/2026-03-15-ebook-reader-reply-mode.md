# Ebook Reader Reply Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a reply mode to `EbookReader` that reuses the host app's real chat composer inside the fullscreen reader.

**Architecture:** Keep the reader inside the plugin iframe, but use `mainDom` to temporarily reparent the host app composer row into a fixed overlay host above the iframe. Reply mode is toggled from the hamburger menu and restores the composer on exit.

**Tech Stack:** API v3 plugin JS, SafeDocument/SafeElement main DOM bridge, Vitest contract tests

---

### Task 1: Add failing contract tests for reply mode surface

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`
- Test: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`

**Step 1: Write the failing test**

Assert the source contains:
- reply mode state/functions
- hamburger menu item label
- mainDom permission request
- composer row lookup
- placeholder/restore flow

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

**Step 3: Implement minimal source changes**

Add the missing reply mode structure in `plugins/EbookReader.js`.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

### Task 2: Add mainDom composer bridge

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Test: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`

**Step 1: Add reply mode state**

Track:
- enabled flag
- root host element ref
- moved composer ref
- origin placeholder ref

**Step 2: Implement bridge helpers**

Add helpers to:
- find composer row
- create overlay host
- move composer into host
- restore composer to placeholder

**Step 3: Keep cleanup safe**

Ensure close/unload always restores the composer.

**Step 4: Run tests**

Run:
- `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`
- `node --check plugins/EbookReader.js`

### Task 3: Add reply mode UI integration

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Test: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`

**Step 1: Extend hamburger menu**

Add a `답장 모드` action row with dynamic on/off label.

**Step 2: Add reader layout state**

When reply mode is active:
- add a reader class or data-state
- increase bottom spacing

**Step 3: Wire menu click to bridge**

Toggle reply mode and close the menu after action.

**Step 4: Verify**

Run:
- `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`
- `node --check plugins/EbookReader.js`

### Task 4: Manual verification

**Files:**
- Modify: none
- Test: runtime behavior in local dev / hot reload

**Step 1: Verify reply mode on**

Open reader, enable `답장 모드`, confirm the real host composer appears above the footer.

**Step 2: Verify send**

Type text and send from inside reader. Confirm the real current session receives the user message and normal generation starts.

**Step 3: Verify restore**

Disable reply mode and close the reader. Confirm the host composer returns to the original chat screen location.
