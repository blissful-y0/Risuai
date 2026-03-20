# Ebook Reader Design

**Date:** 2026-03-13

**Goal:** Turn the current API v3 fullscreen reader prototype into a standalone ebook-style plugin that opens the current chat session as a single readable book.

## Product Definition

Version 1 is intentionally narrow:

- read the currently open chat only
- open in a fullscreen plugin-owned reader
- render the session as continuous novel-style pages
- keep reading controls inside the plugin
- treat this as a separate ebook reader product, not a main-chat DOM patch

This is not a migration of the v2 inline chat-card pager. That product remains an API 2.1 main-DOM plugin. The new product is a distinct reader experience built on API v3.

## Why This Direction

The current prototype revealed a useful behavior change: loading the whole current chat into a dedicated reading surface feels closer to an ebook than a chat utility. That is a better product direction than forcing v2-style controls back into the main chat container.

The reasons are practical:

- API v3 is already suited for fullscreen iframe UI
- the current prototype already has the right skeleton
- the reader can own its visual language without depending on main app DOM
- the current-chat-only scope is enough to validate the ebook use case quickly

## User Flow

1. User clicks the plugin from chat or settings.
2. The plugin opens a fullscreen reader container.
3. The plugin loads the current character index and current chat index through API v3.
4. The current chat session is rendered as ebook pages.
5. The user reads with page buttons, keyboard, wheel, or touch navigation.
6. The user adjusts theme, font, custom font CSS, and bookmark image visibility from the reader controls.
7. The user closes the reader and returns to the app.

## Scope

### In Scope for v1

- current chat only
- fullscreen reader
- two-column desktop layout
- one-column mobile layout
- page navigation
- page indicator
- theme dropdown
- font dropdown
- custom theme picker overlay
- custom font CSS input
- bookmark image toggle
- illustration popover fallback for supported module popovers
- explicit close controls

### Out of Scope for v1

- main chat container inline controls
- bookshelf / library management
- multi-chat browsing
- chapter management
- import from epub/txt/markdown
- export pipeline
- syncing with v2 inline pager behavior

## Architecture

The plugin remains an API v3 script that renders all primary UI inside the sandbox iframe. The reader reads current-session data through RisuAI APIs and owns all rendering inside `document.body.innerHTML`.

The implementation keeps three layers:

- data loading layer
- reader state and navigation layer
- plugin-owned iframe UI layer

Main DOM access is treated as an exception path only for illustration-module popover fallback. The reader itself must not depend on main DOM structure.

## Data Model

The runtime state is owned by a single session-scoped reader state object.

Reader state includes:

- current context
- current page
- total pages
- selected theme
- selected font
- bookmark visibility
- custom theme values
- custom font CSS
- cleanup callbacks

Persistent values are split by purpose:

- `argument`
  - theme
  - font
  - bookmark visibility
- `pluginStorage`
  - custom theme colors
  - custom font CSS
  - any future reader-specific metadata

## Rendering Strategy

The reader must render from source chat data, not from main chat DOM. The current chat is loaded through:

- `getCurrentCharacterIndex()`
- `getCurrentChatIndex()`
- `getCharacterFromIndex()`
- `getChatFromIndex()`

Message rendering converts session messages into reader paragraphs. The renderer should preserve the current “novel page” feel:

- literary spacing
- visible speaker context where needed
- highlighted quoted text
- page-based navigation rather than scroll-first chat reading

## UI Structure

The primary reader shell contains:

- header
- bookmark image strip
- novel body
- content column area
- compact top-right nav bar
- explicit close control

The compact nav bar remains the main control surface:

- settings dropdown trigger
- close button
- first page
- previous page
- page indicator
- next page
- last page

The top-left explicit close button remains because it improves exit discoverability in fullscreen mode.

## Interaction Model

Navigation behavior:

- desktop wheel advances pages
- keyboard left/right pages
- touch swipe pages on mobile
- page snapping happens in the reader content area

The reader should feel deterministic. It is not a scrollable transcript viewer. The main interaction is explicit page turning.

## Error Handling

All bridge calls remain wrapped in `try/catch`.

Failure policy:

- data loading failures render a plugin-owned error view
- storage failures fall back to defaults and log errors
- popover fallback permission denial should not block the reader from opening

The reader must prefer graceful degradation over refusing to open.

## Testing Strategy

The current contract-test style is enough for v1. Tests should assert:

- API 3.0 metadata exists
- fullscreen entry points exist
- current chat APIs are used
- reader shell is plugin-owned
- legacy window-global state is absent
- settings UI is present
- custom theme overlay is present
- popover fallback still exists

Behavior verification in-browser remains manual for:

- page feel
- font switching
- mobile interaction
- module popover behavior

## Future Roadmap

If v1 works well, later versions can expand into:

- session browser
- multi-chat reading
- bookshelf UI
- reading history
- export
- imported ebook sources

Those are future products layered on top of the reader, not requirements for v1.

## Decision Summary

The approved direction is:

- keep the existing API v3 fullscreen reader direction
- develop it as a standalone ebook reader plugin
- optimize for “read the current chat like a book”
- do not chase v2 inline main-chat parity in this product
