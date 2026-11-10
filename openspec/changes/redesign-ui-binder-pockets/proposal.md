## Why

The app has no visual design: unstyled white screens with default browser controls, a 34-line stylesheet with colours hard-coded in it, and no dark theme. The owner finds it awful. A real look is needed, and it has to be built on shared tokens so light and dark (which follow the phone's setting) and every later screen stay consistent.

## What Changes

- A single design-token file defines colour roles, type scale, spacing (8 dp), radius, touch-target size and both themes; every screen uses only those tokens.
- The look is "Nine-Pocket Binder", chosen by the owner: a black archival page where each card row is a clear pocket with a lit top edge, one gold accent for the active filter, the primary Scan action and serial-number tags. The light theme is designed in its own right, not an inverted dark one.
- The theme follows Android's light or dark setting.
- The collection list becomes list-first: count and sync state in a header, search, filter chips, pocket rows with thumbnail, name, year, set and number, and a gold serial tag; one gold Scan card button above the system bars.
- Detail, card form, scan, settings and sign-in screens are restyled on the same tokens, with 48 dp touch targets and the destructive actions (delete, sign out) kept apart from primary ones.
- Out of scope: any change to what the app does, which fields exist, navigation structure or sync; a theme switcher inside the app (it follows the phone); animations beyond standard state transitions; new icons or illustrations; a token build pipeline or component library.

## Capabilities

### New Capabilities
- `app-theme`: the design tokens, their light and dark values, and the rules every screen follows (tokens only, contrast, touch targets).
- `collection-list`: what the collection list screen shows and how a serial-numbered card is marked.

### Modified Capabilities
<!-- None: no existing main spec covers visual design or the list layout; the foundation's card-catalog spec keeps owning what a card contains. -->

## Impact

- `src/app/app.css` is replaced by `src/app/tokens.css` plus component styles that use only tokens; `src/app/*.tsx` gain class names and a few structural elements, with no logic changes.
- New tests: no raw colours outside the token file, token contrast, and the touch-target size.
- `DESIGN.md` (the project's durable design record, written by the impeccable documenter at finish) and the surface brief for the list screen.
- No new runtime dependency, no network, no cost; Roboto and Roboto Mono are the Android system faces and are not downloaded.
