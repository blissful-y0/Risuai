# Dogeared Theme Design

**Date:** 2026-03-12

**Goal:** Create a custom chat theme optimized for long-form AI fiction reading while preserving all existing per-message controls.

## Problem

The current custom theme is tuned for chat-first presentation: prominent header chrome, action-heavy controls, rounded bubble language, and markdown styling that competes with prose. That works for short exchanges, but it fights the actual content when the app is used like an AI novel reader.

The target content is long-form narrative. The UI should feel closer to an ebook or manuscript viewer than a messenger, while still making it obvious that this is character chat and preserving editing, generation info, reroll, translation, and related controls.

## Constraints

- The custom HTML is rendered per message, not for the whole transcript.
- Special tags must remain usable:
  - `<risutextbox>`
  - `<risuicon>`
  - `<risubuttons>`
  - `<risugeninfo>`
- User and character messages should both read as cards, not bubbles.
- Character imagery must stay visible.
- Mobile must remain usable without hiding actions behind hover-only interactions.
- This iteration is for the light theme only. A separate dark variant can be designed later.

## Chosen Direction

Create a new theme named `dogeared`.

The visual direction shifts away from warm library-paper styling and toward a colder, quieter literary mood inspired by Japanese winter prose:

- White and blue-gray surfaces instead of cream and sepia
- More empty space and thinner dividers
- Body text that feels printed rather than app-like
- Metadata that reads like edition information, not chat chrome
- Character imagery that feels embedded into the page rather than pasted on top

## Layout

### Desktop

Each message card keeps a two-column structure:

- Left: vertical bookmark thumbnail with the character image
- Right: reading panel with top metadata, prose body, and bottom action bar

The bookmark remains on desktop because it preserves character identity without taking much horizontal space.
Desktop should feel like a quiet printed page: restrained bookmark, black serif metadata, pale rules, and generous empty space.
The top metadata should read like an editorial title line, not an app header: name as a small title, model info as a quiet edition note.
The actual rendered title nodes and edition wrapper need direct styling so hidden framework utility classes do not pull them out of alignment.

### Mobile

Mobile switches to an integrated header:

- A wide banner-style image at the top of the card
- A cover-like overlaid metadata line with name and optional model info resting on the banner
- The prose body below
- The action buttons separated into a bottom bar

This avoids the current floating-thumbnail problem and feels more like a book plate or chapter banner.
The banner should be slightly lower than the previous draft, fully attached to the card, and should not use a sharp diagonal crop.
The title should sit inside the lower band of the banner with a pale fog-like fade, and the fade should live in the banner image layer rather than a narrower header overlay, so the mobile card reads like a cover plate rather than a clipped strip.
Mobile should feel like a pocket edition of the same work rather than a shrunken desktop card.
Its title line should use the same editorial logic, only denser and more compact.

## Typography

- Prose uses `BookkMyungjo`
- Metadata also uses `BookkMyungjo`
- Headings keep distinct sizing
- All other text elements share one body size:
  - paragraphs
  - list items
  - emphasis
  - strong
  - quotes
  - code
  - table cells

Markdown distinction comes from color and subtle surfaces, not size changes.
The prose font needs to be applied to the actual rendered text descendants, not only the outer prose container, so it still holds if nested markup adds its own font styling.
The reading density should be slightly tighter than the current draft: narrower line-height, smaller paragraph gaps, less floating whitespace.
Both desktop and mobile should preserve more usable line width than the current draft: lighter outer margins, slightly tighter inner padding, and a less cramped mobile text measure.
Character and user names should both be black serif text, not accent-colored labels.
Model information should remain smaller and gray, closer to an edition label than an app badge.
Latin names should still render in a matching serif face rather than falling back to a sans UI font.

## Interaction Model

- `risubuttons` remain always available in a separate bottom action row
- `risugeninfo` remains visible for character messages in the top metadata line
- Buttons are visually toned down but not hidden
- No hover-only dependency for essential controls

## Content Styling

- `''` and `""` remain differentiated by color only
- `''` and `""` can carry a very faint tinted paper background, as long as it reads like a trace on the page rather than a UI highlight
- `''` and `""` should still use the same serif family as the surrounding prose
- Markdown emphasis should follow markdown semantics again: `*` italic, `**` bold, `***` bold italic
- Prose rhythm should borrow from the preferred novel viewer reference: justified text, first-line paragraph indent, and smaller paragraph gaps
- Body text should feel calm and high-contrast, not decorative
- Strong/emphasis styling should be restrained
- Dividers and inline code surfaces should be cooler and lighter than the current warm treatment
- Desktop and mobile should clearly feel like different print formats of the same theme, not just the same CSS scaled down

## Deliverables

- New theme folder: `plugins/themes/dogeared/`
- Theme HTML template
- Theme CSS
- Lightweight regression test for required structure and selector scoping
