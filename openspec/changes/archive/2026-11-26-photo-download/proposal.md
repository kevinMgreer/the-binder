## Why

The owner wants a card photo out of the app, for example to send it to someone or keep it with other pictures. Ruling T-58: save it straight to the phone's gallery. Today the only copies are in the app and in the Drive photos folder, and Android's WebView cannot save a blob download, so this needs a native gallery plugin.

## What Changes

- The full-size photo view gets one more icon-only button beside the X: a download icon named "Save to phone", 48 px, same look as the X. No visible text, no new row.
- Tapping it saves the full photo of the side shown to the phone's gallery, in an album "The Binder", named from the card the same way as its Drive file (year, maker, card number, player, side).
- The result shows as a short status over the photo: "Saved to Photos", or a clear error. It fades after a few seconds.
- With no full photo on the device it fetches and caches it first, the same way the view does. Offline with no full photo it saves nothing and says it needs a connection. It never saves the thumbnail.
- A small `Gallery` port with a fake for tests, and a Capacitor adapter over `@capacitor-community/media`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `card-photos`: new requirement "Save a photo to the phone".

## Out of scope

- Saving both sides at once, bulk download of many cards, the Android share sheet.
- Saving from the card detail screen, the list or the form: only from the full-size view.
- Converting to JPEG: the stored WebP is saved as is.
- Gallery mode (reading other albums) and any storage permission.
- iOS and web: the app is Android only; in the browser dev build the fake gallery is used.

## Impact

- `src/ports/index.ts`, `src/adapters/fakes.ts`, new `src/adapters/capacitor-gallery.ts`, `src/main.tsx`.
- `src/app/PhotoView.tsx`, `src/app/Icon.tsx`, `src/app/app.css`, new `src/app/photo-download.test.tsx`.
- `package.json` / `package-lock.json`: `@capacitor-community/media` 9.x; `android/` after `npx cap sync android`.
- `DESIGN.md` (viewer controls, icon list), `docs/device-checklist.md` (phone check).
- No data, storage or sync change. No new cost.
