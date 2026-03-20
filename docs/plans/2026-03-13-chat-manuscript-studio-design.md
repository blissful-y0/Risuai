# Chat Manuscript Studio Design

**Date:** 2026-03-13

**Goal:** Build a brand-new API v3 plugin that turns the current character's RisuAI chat sessions into an ebook/manuscript workspace: browse that character's sessions, read them in a novel-style reader, save curated manuscript entries, and export polished multi-session Markdown files.

## Problem

The current assets in the repo split the desired workflow into incompatible pieces:

- `chat novel viewer v.1.1 fixed.js` has a useful “chat logs as pages” concept, but it is a legacy main-DOM plugin with floating buttons, `localStorage`, and file-import-first assumptions.
- `EbookReader.js` is already migrated to API v3 and has a fullscreen iframe reader, but it is optimized for reading the current chat only. It is not a manuscript workspace, does not organize sessions by character, and does not manage exportable saved works.

The target product is not “a prettier chat viewer.” It is a **plugin-only novel workspace** where users can:

1. open a plugin from the chat-side button or settings,
2. land in the current character workspace,
3. browse that character’s sessions,
4. transform a session into readable manuscript text,
5. edit metadata,
6. save the result to a personal library,
7. export one or more sessions as a release-ready `.md` manuscript.

## Constraints

- This must be a **new API v3 plugin**, not a main-app feature.
- The plugin must run inside the v3 sandbox iframe and use `registerSetting` / `registerButton` plus `showContainer('fullscreen')`.
- The plugin must not depend on main chat DOM structure.
- Source data should come from chat APIs such as `getCurrentCharacterIndex`, `getCurrentChatIndex`, `getCharacterFromIndex`, and `getChatFromIndex`.
- Persistent data should use `pluginStorage` and arguments, not `localStorage`.
- The UI should visually inherit the “novel theme / ebook” direction, but it is plugin-owned HTML/CSS, not direct reuse of theme HTML tags.
- Export should target **human-editable Markdown** suitable for later refinement, not just a raw dump.
- The plugin API does not expose an official `downloadFile()` helper. Export therefore needs to rely on iframe-side browser download primitives and must keep a fallback path ready if browser policy blocks direct download.

## Chosen Direction

Create a **fully new plugin** with a neutral working name: `ChatManuscriptStudio`.

The plugin is a self-contained manuscript workspace with three primary surfaces inside one fullscreen iframe:

1. **Current Character Panel**
2. **Session Browser**
3. **Novel Reader / Manuscript View**
4. **Export Composer**

The primary entry flow is:

1. click the chat-side plugin button,
2. open the fullscreen container,
3. render the current character workspace,
4. load that character's sessions,
5. open the current session into the reader without scanning the full save.

This is intentionally not a patch on top of either existing plugin. We will reuse ideas, not structure:

- Reuse the **novel-reading visual language** from `EbookReader`
- Reuse the **session-to-text cleanup ideas** from `chat novel viewer`
- Rebuild all state, storage, and UI around API v3 rules

## Product Shape

### Current Character Panel

The first screen is centered on the currently open character, not the whole save file.

It shows:

- character name
- optional portrait/banner later if cheap to load
- session count for the current character
- saved manuscript count for the current character
- current-character-only workspace framing

### Session Browser

Opening the plugin reveals all sessions for the current character.

Each session item shows:

- auto-generated temporary title
- editable custom title if the user saved one
- chat date / last modified time
- approximate message count
- saved / unsaved state
- export selection toggle

The title policy is:

- generate a temporary title automatically
- let the user edit and finalize it
- never force permanent auto titles

### Novel Reader / Manuscript View

Opening a session launches a fullscreen novel reader inside the plugin iframe.

The reader should feel like an ebook, not a messenger:

- novel theme inspired layout
- desktop two-page option
- mobile single-page flow
- typography controls
- bookmark support
- section navigation
- quick metadata editing without leaving the reader

The reader is also the manuscript preview surface. Users are not just reading; they are checking whether the session is export-worthy.

### Export Composer

Users can select one or more sessions from the same character and export them as a single Markdown manuscript.

The export surface should support:

- work title
- author / pen name
- character name
- tags
- optional description / note
- session ordering
- include or exclude per-session front headings
- preview of the final Markdown structure

## Information Architecture

The core hierarchy is:

- Character
- Session
- Manuscript Entry
- Export Project

### Character

Represents a real RisuAI character and is loaded from current save data. The plugin does not own this data; it references it.

### Session

Represents one chat session from that character. The plugin reads it from RisuAI and derives a manuscript candidate from it.

### Manuscript Entry

Represents plugin-owned saved editorial data for a session, for example:

- custom title
- subtitle
- session tags
- bookmark page
- chapter split hints
- cleaned manuscript text snapshot
- notes
- inclusion status for export

### Export Project

Represents a multi-session manuscript assembly for one character:

- selected session ids
- chosen order
- work title
- work tags
- work description
- author metadata
- export timestamp
- final markdown preview

## Data Model

The plugin should separate **source-of-truth chat data** from **plugin-owned editorial data**.

### Read-only source data

Loaded live from RisuAI:

- current character summary
- character metadata
- session list
- raw session messages

### Saved editorial data

Stored in `pluginStorage`:

- per-character library metadata
- per-session manuscript metadata such as title, session tags, notes, and bookmark
- per-work export project metadata such as work title, work tags, author, order, and description
- export drafts
- reading bookmarks
- typography preferences that should sync with the save

### Device-local UI preferences

If there are purely device-local preferences later, they can live in `safeLocalStorage`, but first version should prefer `pluginStorage` for user-visible reading and manuscript state so the library travels with the save.

## Session-to-Manuscript Conversion

The first version uses **weak automatic normalization**, not LLM rewriting.

### Included behavior

- remove obvious HTML / tag noise
- normalize repeated empty lines
- keep headings like `##` / `###` if they already exist
- convert rough action/dialogue formatting into calmer prose blocks when pattern matching is reliable
- preserve readable emphasis where possible
- keep line and paragraph boundaries stable enough for manual editing later

### Excluded behavior

- no creative rewriting
- no perspective changes
- no semantic reinterpretation of scenes
- no model-based beautification in v1

This keeps the export trustworthy and editable.

## Reader UX

The reader should borrow the literary feel of the existing novel theme direction:

- restrained header chrome
- body-first layout
- long-form typography
- quiet controls
- explicit page state

Recommended reader controls:

- previous / next page
- first / last
- bookmark current page
- toggle one-page / two-page mode on desktop
- font, size, line-height, theme controls
- “edit metadata” drawer
- “save manuscript entry”
- “add to export selection”

## Long-Session Performance Strategy

The product requirement is still to let users read a session from beginning to end. That does **not** mean rendering the entire manuscript as one large live DOM tree.

The first implementation should explicitly optimize for very long chats:

- load the full session data so export can always use the complete source
- normalize messages in chunks instead of blocking the first render on one giant pass
- build page boundaries incrementally and continue background pagination after the reader opens
- render only the current page plus a small adjacent buffer, not the entire book at once
- keep reader navigation state lightweight and page-index based instead of DOM-position based
- reserve full-text assembly for export, copy, or explicit preview generation paths

This keeps the “read the whole session” promise without making ultra-long sessions unusable.

## Markdown Export Format

Export output should look like a manuscript, not like chat logs.

Recommended shape:

```md
---
title: "Work Title"
author: "Pen Name"
character: "Character Name"
source: "RisuAI chat sessions"
created: "2026-03-13"
tags:
  - risuai
  - chat-novel
---

# Work Title

## Cast
- Character: ...
- User / Protagonist: ...

## Session 1. Temporary or Edited Title

Manuscript text...

## Session 2. Another Title

Manuscript text...
```

### Export principles

- front matter should be optional but enabled by default
- headings should be stable and deterministic
- session order must be user-controlled
- output must stay plain Markdown, not HTML-heavy markdown
- the result should be immediately editable in Obsidian, Typora, VS Code, GitHub, or Pandoc-based workflows

## Download Strategy

There is no official plugin `downloadFile()` API in v3. First implementation should therefore use:

- `Blob`
- `URL.createObjectURL`
- temporary `<a download>`
- click-triggered download from inside the iframe

This is viable because the plugin host iframe is created with `allow-downloads`.

If browser behavior still blocks downloads in some environments, the fallback should be:

- preview the full Markdown in a textarea / code view
- provide “copy to clipboard”
- optionally provide “save as asset” later if storing generated manuscripts inside Risu becomes useful

## Storage Strategy

Store data under a single plugin namespace schema in `pluginStorage`.

Suggested top-level buckets:

- `library.characters`
- `library.sessions`
- `library.exports`
- `reader.preferences`

This should remain JSON-serializable and versioned, so the plugin can migrate saved editorial state later.

## Error Handling

The plugin should fail softly:

- if character/session loading fails, show an in-plugin empty/error state
- if a session cannot be normalized, preserve raw text instead of dropping content
- if export download fails, fall back to preview + copy
- if storage writes fail, do not destroy the live reader state

## Deferred Features

These are intentionally out of scope for v1:

- LLM-based rewriting
- automatic relationship analysis
- cross-character anthology export
- EPUB / PDF export
- collaborative annotations
- inline scene reordering inside a single session
- rich markdown editor with block-level drag/drop

## Risks

### 1. Session enumeration gaps

We need to verify exactly how complete the available chat APIs are for listing all sessions of a character without relying on main DOM. This is the largest functional risk and should be validated early with a thin spike.

### 2. Download behavior across environments

Download via iframe/browser primitives is likely viable but must be tested in browser and Tauri contexts.

### 3. Conversion quality

Weak normalization is safer than rewriting, but if the cleanup rules are too aggressive the manuscript may lose useful nuance. Rule-based cleanup should stay conservative.

## Recommended MVP

Version 1 should include only:

- current character panel
- session list for one character
- current-session manuscript conversion
- saved manuscript entry metadata
- fullscreen novel reader
- multi-session selection
- release-style Markdown export

That is enough to prove the product without dragging in a full editorial suite.

## Delivery Milestones

### Milestone 1

Prove the data path:

- load characters
- list current character sessions
- open one session

### Milestone 2

Prove the manuscript path:

- normalize one session
- render it in the reader
- save metadata + bookmark

### Milestone 3

Prove the export path:

- select multiple sessions
- compose final Markdown
- download or fallback-copy successfully

## Final Recommendation

Do not retrofit this into either existing plugin.

Build a new API v3 plugin with a neutral working name and treat it as a manuscript product, not just a reader. Reuse the aesthetic lessons of the novel theme and the normalization heuristics of the old chat viewer, but keep the architecture fully new and fully v3-native.
