# Copilot Provider Console Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the Copilot provider plugin into a cleaner console-style single-page UI while adding multi-key fallback and per-key status/quota visibility.

**Architecture:** Keep the plugin as a single self-contained userscript file. Improve data helpers first so token rotation, status aggregation, and quota extraction are stable, then rebuild the `showSettingsUI` layout and rendering around those helpers.

**Tech Stack:** Plain JavaScript, pluginStorage, Risuai plugin APIs, DOM string rendering, GitHub Copilot internal endpoints.

---

### Task 1: Stabilize token and status helpers

**Files:**
- Modify: `/Users/bliss/Downloads/copilot-provider_v2.9.0.js`

**Step 1: Add token parsing and rotation helpers**

Implement helpers for:
- parsing multiple OAuth tokens from a single field
- serializing them back to storage
- deciding when to rotate to the next token

**Step 2: Route provider requests through token fallback**

Update the provider handler so request execution retries with the next token on auth/rate-limit style failures.

**Step 3: Extend status data extraction**

Add extraction of quota-like fields from the Copilot internal user response:
- `quota_snapshots.premium_interactions`
- `quota_reset_date_utc`

**Step 4: Verify syntax**

Run: `node --check '/Users/bliss/Downloads/copilot-provider_v2.9.0.js'`
Expected: exit code `0`

### Task 2: Redesign the single-page console layout

**Files:**
- Modify: `/Users/bliss/Downloads/copilot-provider_v2.9.0.js`

**Step 1: Replace the current visual language**

Rewrite the CSS block used by `showSettingsUI` to use a cleaner console-style layout with:
- strong section separation
- compact cards
- responsive 2-column to 1-column collapse
- better typography and spacing

**Step 2: Rework top-level layout**

Keep everything on one page, but organize it into:
- header / actions
- token console
- per-key status cards
- models / inspector

**Step 3: Improve token controls**

Expose multi-key input clearly, surface token count, and keep add/test/save/remove flows readable.

**Step 4: Improve model settings readability**

Keep model settings inline, but make collapsed cards denser and expanded settings more legible.

**Step 5: Verify syntax**

Run: `node --check '/Users/bliss/Downloads/copilot-provider_v2.9.0.js'`
Expected: exit code `0`

### Task 3: Final verification

**Files:**
- Modify: `/Users/bliss/Downloads/copilot-provider_v2.9.0.js`

**Step 1: Check quota/status rendering references**

Confirm per-key cards only reference fields returned by the status helper.

**Step 2: Check reasoning effort UI wiring**

Confirm only supported staged reasoning levels are rendered and saved.

**Step 3: Final syntax verification**

Run: `node --check '/Users/bliss/Downloads/copilot-provider_v2.9.0.js'`
Expected: exit code `0`
