# Ebook Reader Cache Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-session edition caching, latest-first validation, loading feedback, and a cache management modal to Ebook Reader.

**Architecture:** Keep source chat data untouched and store only reader-owned editions in plugin storage. Validate every cache entry against the current session using `messageCount + lastMessageHash`, reuse only valid editions, and expose cache management through the reader's `more` modal.

**Tech Stack:** API v3 plugin JavaScript, `pluginStorage`, Vitest contract tests

---

### Task 1: Add cache contracts

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`

**Step 1: Write failing tests**
- Add tests for cache index key names, edition cache functions, cache validation, loading state labels, `more` modal, and cache management modal.

**Step 2: Run test to verify it fails**
- Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

**Step 3: Write minimal implementation**
- Add cache constants, storage helpers, and placeholder modal functions required by the tests.

**Step 4: Run test to verify it passes**
- Run: `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`

### Task 2: Implement edition cache storage and validation

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Test: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`

**Step 1: Add failing tests if needed**
- Cover `messageCount + lastMessageHash` validation and per-session cache keys.

**Step 2: Implement**
- Add cache index read/write.
- Add session cache key generation.
- Add edition serialization.
- Add latest-first validation before render.

**Step 3: Verify**
- Run tests and `node --check plugins/EbookReader.js`

### Task 3: Add loading feedback and cache management UI

**Files:**
- Modify: `/Users/bliss/Documents/Risuai/plugins/EbookReader.js`
- Test: `/Users/bliss/Documents/Risuai/plugins/EbookReader.test.ts`

**Step 1: Write failing tests**
- Cover loading labels, `more` modal, cache management modal, current-session summary, list items, delete actions, and clear-all action.

**Step 2: Implement**
- Add loading overlay/state.
- Wire `more` button to modal.
- Add cache management modal rendering and actions.

**Step 3: Verify**
- Run:
  - `pnpm exec vitest run plugins/EbookReader.test.ts --exclude '.worktrees/**'`
  - `node --check plugins/EbookReader.js`
