# Blackice Theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a separate dark theme based on `dogeared` with the same layout and controls but a cold ink-dark "Snow Country at night" presentation.

**Architecture:** Copy the existing `dogeared` theme into a new theme folder so the light and dark editions can evolve independently. Keep the same HTML structure and selector contract, then retune only palette, divider contrast, action chrome, and banner fade behavior for dark surfaces.

**Tech Stack:** Custom HTML template, CSS, Vitest-style file assertions, Node fallback verification

---

### Task 1: Create the dark-theme test contract

**Files:**
- Create: `plugins/themes/blackice/theme.test.ts`
- Verify: `plugins/themes/blackice/guiHTML.html`
- Verify: `plugins/themes/blackice/customCSS.css`

**Step 1: Write the failing test**

Require the new dark theme to:
- keep the same required Risu template tags and layout containers
- use a dark paper palette instead of the light `dogeared` paper palette
- keep serif metadata/body typography
- preserve the mobile full-bleed banner structure

**Step 2: Run test to verify it fails**

Run:

```bash
node <<'EOF'
const fs = require('node:fs')
const path = 'plugins/themes/blackice/customCSS.css'
if (!fs.existsSync(path)) {
  console.log('failing as expected')
  process.exit(0)
}
console.error('expected dark theme CSS to be missing before implementation')
process.exit(1)
EOF
```

Expected: `failing as expected`

**Step 3: Write minimal implementation**

Add the new test file with structural assertions copied from `dogeared` and dark-palette-specific expectations.

**Step 4: Run test to verify it passes**

Run the focused Node verification for the new folder.

Expected: exit code 0

### Task 2: Create the dark theme files from dogeared

**Files:**
- Create: `plugins/themes/blackice/guiHTML.html`
- Create: `plugins/themes/blackice/customCSS.css`
- Create: `plugins/themes/blackice/theme.test.ts`

**Step 1: Write the failing test**

Use the contract from Task 1 to require the dark theme folder contents and selectors.

**Step 2: Run test to verify it fails**

Run the focused Node verification again before copying files.

Expected: fail until the files exist and contain dark-theme expectations

**Step 3: Write minimal implementation**

Copy the `dogeared` HTML/CSS/test into the new `blackice` theme folder, then adapt the contract name strings.

**Step 4: Run test to verify it passes**

Run the focused Node verification for required structure.

Expected: exit code 0

### Task 3: Retune the palette and banner fade for the dark edition

**Files:**
- Modify: `plugins/themes/blackice/customCSS.css`
- Modify: `plugins/themes/blackice/theme.test.ts`
- Verify: `plugins/themes/blackice/guiHTML.html`

**Step 1: Write the failing test**

Require the dark theme CSS to include:
- cold black/blue-gray paper tokens
- off-white ink instead of pure black text
- darker action/background chrome
- darker banner fade logic suited to a dark card
- preserved title-line alignment and mobile full-bleed banner rules

**Step 2: Run test to verify it fails**

Run the focused Node verification script against the dark CSS.

Expected: fail until the dark palette and fade values are present

**Step 3: Write minimal implementation**

Update the CSS to:
- swap light paper colors for dark ink-paper colors
- keep BookkMyungjo and Source Serif 4
- preserve the desktop bookmark and mobile cover layout
- retune hover/action tones for dark surfaces
- move quotes/code/blockquote fills into low-contrast ink washes

**Step 4: Run test to verify it passes**

Run the focused Node verification for dark palette selectors.

Expected: exit code 0

### Task 4: Verify and document

**Files:**
- Verify: `plugins/themes/blackice/guiHTML.html`
- Verify: `plugins/themes/blackice/customCSS.css`
- Verify: `plugins/themes/blackice/theme.test.ts`
- Verify: `docs/plans/2026-03-12-blackice-theme.md`

**Step 1: Run focused verification**

Run:

```bash
node <<'EOF'
const fs = require('node:fs')
const html = fs.readFileSync('plugins/themes/blackice/guiHTML.html', 'utf8')
const css = fs.readFileSync('plugins/themes/blackice/customCSS.css', 'utf8')
const checks = {
  requiredTags:
    html.includes('<risuicon></risuicon>') &&
    html.includes('<risutextbox></risutextbox>') &&
    html.includes('<risubuttons></risubuttons>') &&
    html.includes('<risugeninfo></risugeninfo>'),
  darkPaper: /--dg-paper:\s*#[0-9a-f]{6}/i.test(css),
  banner: /@media \(max-width: 640px\)[\s\S]*\.reader-banner\s*\{[\s\S]*display:\s*block/.test(css),
  serif: /BookkMyungjo/.test(css),
}
if (!Object.values(checks).every(Boolean)) {
  console.error(checks)
  process.exit(1)
}
console.log('blackice theme verification ok')
EOF
```

Expected: `blackice theme verification ok`

**Step 2: Run project checks if dependencies exist**

Run:

```bash
pnpm test -- plugins/themes/blackice/theme.test.ts
pnpm check
```

Expected: either pass, or clearly fail due to missing `node_modules`
