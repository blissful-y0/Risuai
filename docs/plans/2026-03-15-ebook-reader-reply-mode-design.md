# Ebook Reader Reply Mode Design

## Goal

Allow the fullscreen `EbookReader` plugin to expose real chat sending inside the reader without modifying the host app code.

## Constraint

- No host-app API changes
- No custom fake send pipeline inside the plugin
- Must reuse the existing Risu chat send flow

## Chosen Approach

Use `mainDom` access to temporarily move the host app's real chat composer row into a fixed overlay host above the fullscreen plugin iframe.

## Flow

1. User opens the reader.
2. User opens the hamburger menu.
3. User toggles `답장 모드`.
4. Plugin requests `mainDom` permission if needed.
5. Plugin finds the host app composer row by locating `.default-chat-screen .text-input-area` and taking its parent row.
6. Plugin creates a fixed overlay host in the main document.
7. Plugin swaps the original composer row with a hidden placeholder, then appends the real composer row into the overlay host.
8. Existing textarea/send behavior continues to work because the original DOM node and Svelte handlers are reused.
9. Disabling reply mode or closing the reader restores the composer row to its original location and removes the overlay host.

## UI

- Reader remains fullscreen.
- Reply mode is toggled from the hamburger menu.
- The moved composer row appears above the reader footer.
- Reader body gets extra bottom spacing while reply mode is active so content is not obscured.

## Risks

- Depends on current chat DOM structure.
- If the composer markup changes, selector-based lookup can fail.
- Cleanup must always restore the composer row, even on close.

## Non-goals

- Reimplementing host send logic inside the plugin
- Building a custom fake textarea/send pipeline
- Host app source changes
