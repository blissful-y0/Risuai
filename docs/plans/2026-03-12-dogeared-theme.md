# Dogeared Theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine `dogeared` into a cold, Snow Country-inspired reading theme with a distinct desktop print-page feel, a distinct mobile pocket-edition feel, `BookkMyungjo` across prose and metadata, and preserved per-message controls.

**Architecture:** The implementation stays inside `plugins/themes/dogeared/`. The HTML keeps the required Risu template tags and existing structural layout, while CSS differentiates the desktop and mobile presentation more strongly. The stylesheet will unify metadata and prose under the same serif family, tone down bookmark prominence on desktop, and make mobile feel like a separate compact edition without changing runtime Svelte code.

**Tech Stack:** Custom HTML template, CSS, Vitest-style file assertions, Node fallback verification

---

### Task 1: Expand regression coverage for the approved winter-reading direction

**Files:**
- Modify: `plugins/themes/dogeared/theme.test.ts`
- Verify: `plugins/themes/dogeared/guiHTML.html`
- Verify: `plugins/themes/dogeared/customCSS.css`

**Step 1: Write the failing test**

Add assertions that require:

- a dedicated banner image container in the template for mobile styling
- `BookkMyungjo` to be declared in CSS and used for prose text
- mobile rules that hide the desktop bookmark role label and expose the banner image block
- the bottom action bar to stay structurally separate from the prose body

**Step 2: Run test to verify it fails**

Run:

```bash
node --input-type=module <<'EOF'
import { readFileSync } from 'node:fs'

const html = readFileSync('plugins/themes/dogeared/guiHTML.html', 'utf8')
const css = readFileSync('plugins/themes/dogeared/customCSS.css', 'utf8')

const checks = [
    html.includes('reader-banner'),
    /BookkMyungjo/.test(css),
    /\.reader-banner\s*\{/.test(css),
    /\.reader-actions\s*\{[\s\S]*border-top:/.test(css)
]

if (checks.every(Boolean)) {
    console.error('expected new winter-theme checks to fail before implementation')
    process.exit(1)
}

console.log('failing as expected')
EOF
```

Expected: `failing as expected`

**Step 3: Write minimal implementation**

Update the test file with the new structural and style assertions.

**Step 4: Run test to verify it passes**

Run the same Node command again after the real implementation work.

Expected: all checks succeed

**Step 5: Commit**

```bash
git add plugins/themes/dogeared/theme.test.ts
git commit -m "test: extend dogeared theme contract"
```

### Task 2: Add the mobile banner hook to the template

**Files:**
- Modify: `plugins/themes/dogeared/guiHTML.html`
- Test: `plugins/themes/dogeared/theme.test.ts`

**Step 1: Write the failing test**

Require the template to contain:

- a `reader-banner` block
- a `reader-banner-art` block with `risuicon`
- the existing `reader-header`, `reader-body`, and `reader-actions` containers

**Step 2: Run test to verify it fails**

Run the focused Node assertion command from Task 1.

Expected: fail until the new banner containers exist

**Step 3: Write minimal implementation**

Keep the desktop bookmark structure, but add a mobile banner image block that reuses the same `risuicon` source through CSS visibility rules.

**Step 4: Run test to verify it passes**

Run the focused Node assertion command again.

Expected: exit code 0

**Step 5: Commit**

```bash
git add plugins/themes/dogeared/guiHTML.html plugins/themes/dogeared/theme.test.ts
git commit -m "feat: add dogeared mobile banner structure"
```

### Task 3: Restyle the theme for the approved winter-literary direction

**Files:**
- Modify: `plugins/themes/dogeared/customCSS.css`
- Test: `plugins/themes/dogeared/theme.test.ts`

**Step 1: Write the failing test**

Add assertions that require:

- a cold white / blue-gray palette instead of the warm cream palette
- `BookkMyungjo` as the prose font family
- `BookkMyungjo` as the metadata font family
- black serif names instead of accent-colored name text
- a smaller gray model label
- mobile banner layout rules at the small-screen breakpoint
- desktop bookmark rules to remain available above the mobile breakpoint
- mobile banner rules that avoid a sharp diagonal crop
- prose font rules that reach rendered text descendants, not just the outer wrapper
- desktop/mobile rules that make the two formats feel intentionally different, not just scaled

**Step 2: Run test to verify it fails**

Run the focused Node assertion command with the new CSS checks.

Expected: fail until the winter palette and banner rules are present

**Step 3: Write minimal implementation**

Update the CSS to:

- switch the palette to cold paper whites and blue-grays
- keep the bookmark image on desktop
- show the banner image and hide the bookmark art on mobile
- lower the mobile banner height slightly and remove the sharp diagonal crop
- make the mobile title and edition note sit inside the lower band of the banner so the header reads like a cover, not a stacked strip plus label
- use `BookkMyungjo` for prose and metadata, with names in black and model info in gray
- make desktop read more like a quiet printed page and mobile more like a compact edition
- make the top metadata line read like an editorial title line, with a stronger name treatment and quieter edition note
- add a serif fallback for latin names so english character names do not fall back to a UI sans font
- override framework utility wrappers inside the metadata line so the title and edition note stay on one optical row
- give inline quote marks a very faint tinted background so they linger like marked prose, not app-style highlights
- tighten line-height and paragraph spacing so the page reads less airy
- reduce wasted horizontal space on both desktop and mobile so prose wraps less aggressively
- make inline quote marks inherit the same serif family as surrounding prose
- restore normal markdown emphasis semantics instead of flattening them
- apply justified prose, first-line paragraph indentation, and tighter paragraph rhythm from the preferred novel-viewer reference
- preserve all controls with the header at top and actions at bottom

**Step 4: Run test to verify it passes**

Run the focused Node assertion command again.

Expected: exit code 0

**Step 5: Commit**

```bash
git add plugins/themes/dogeared/customCSS.css plugins/themes/dogeared/theme.test.ts
git commit -m "feat: restyle dogeared for winter reading"
```

### Task 4: Final verification

**Files:**
- Verify: `plugins/themes/dogeared/guiHTML.html`
- Verify: `plugins/themes/dogeared/customCSS.css`
- Verify: `plugins/themes/dogeared/theme.test.ts`
- Verify: `docs/plans/2026-03-12-dogeared-theme-design.md`

**Step 1: Run focused verification**

Run:

```bash
node --input-type=module <<'EOF'
import { readFileSync } from 'node:fs'

const html = readFileSync('plugins/themes/dogeared/guiHTML.html', 'utf8')
const css = readFileSync('plugins/themes/dogeared/customCSS.css', 'utf8')

const checks = {
    requiredTags:
        html.includes('<risuicon></risuicon>') &&
        html.includes('<risutextbox></risutextbox>') &&
        html.includes('<risubuttons></risubuttons>') &&
        html.includes('<risugeninfo></risugeninfo>'),
    banner: html.includes('reader-banner') && html.includes('reader-banner-art'),
    font: /BookkMyungjo/.test(css),
    coldPalette: /--dg-paper:\s*#f[0-9a-f]{5}/i.test(css) && /--dg-mist:/i.test(css),
    mobileBanner:
        /@media \(max-width: 640px\)/.test(css) &&
        /\.reader-banner\s*\{[\s\S]*display:\s*block/.test(css),
    bottomActions: /\.reader-actions\s*\{[\s\S]*border-top:/.test(css)
}

if (!Object.values(checks).every(Boolean)) {
    console.error(checks)
    process.exit(1)
}

console.log('dogeared winter theme verification ok')
EOF
```

Expected: `dogeared winter theme verification ok`

**Step 2: Run project checks if dependencies exist**

Run:

```bash
pnpm test -- plugins/themes/dogeared/theme.test.ts
pnpm check
```

Expected: pass if `node_modules` is installed; otherwise note that dependency installation is required

**Step 3: Commit**

```bash
git add plugins/themes/dogeared docs/plans/2026-03-12-dogeared-theme-design.md docs/plans/2026-03-12-dogeared-theme.md
git commit -m "docs: update dogeared winter theme plan"
```
