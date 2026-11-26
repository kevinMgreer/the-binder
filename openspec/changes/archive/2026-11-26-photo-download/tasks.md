## 1. Spec

- [x] 1.1 `npx openspec validate photo-download --strict` passes. Verify: exit 0.

## 2. Port, fake and tests first

- [x] 2.1 `src/ports/index.ts`: add `export interface Gallery { save(photo: Blob, name: string): Promise<void> }` and `gallery: Gallery` to `Ports`. `src/adapters/fakes.ts`: `FakeGallery` with `saved: { photo: Blob; name: string }[]` and `error: Error | null` (throws when set, like `FakeReleaseFeed`); add `gallery: new FakeGallery()` to `createFakePorts()`. Verify: `npx tsc -b` passes.
- [x] 2.2 New `src/app/photo-download.test.tsx`, one test per scenario of "Save a photo to the phone", set up like `card-detail.test.tsx` (fake ports, open the card detail, tap a photo). "Save the front": the full blob, a name ending `front-<id8>` with no `.webp`, `role="status"` reading "Saved to Photos". "Save the side shown": press the "Back" dot, then save; only the back is saved. "Full photo fetched first": only a thumbnail plus a remote photo; `photos.getFull` returns the remote blob afterwards and the saved blob is the full one, not the thumbnail. "Offline without the full photo": `navigator.onLine` false; `saved` is empty and the status names a connection. "Save fails": `gallery.error` set; "Could not save the photo"; the button is enabled again. "Status goes away": fake timers, 3 s. "Button shape": a button named "Save to phone" with no text content. Verify: the new tests fail on today's code.

## 3. Implement

- [x] 3.1 `src/app/Icon.tsx`: add `download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"` to `PATHS`. Verify: typecheck.
- [x] 3.2 `src/app/PhotoView.tsx`: move the download-and-cache step out of the effect into a local `loadFull()` used by both the effect and a new `save()` handler. Render the "Save to phone" icon button (`icon-button viewer-close viewer-save`, `<Icon name="download" />`), disabled while saving, and a `<p role="status" className="viewer-toast">` cleared after 3 s (clear the timer on unmount). Name: `photoFileName(card, side)` from `src/sync/names.ts` without `.webp`. Messages as in design.md. Verify: `npx vitest run src/app/photo-download.test.tsx` passes, `src/app/card-detail.test.tsx` still passes.
- [x] 3.3 `src/app/app.css`: `.viewer-save` sits at the X's top, one 48 px slot plus `--space-1` to its left; `.viewer-toast` sits over the bottom of the photo above `.photo-dots`, in `--color-viewer` and `--color-viewer-ink`, without changing the layout. Verify: `e2e/design.spec.ts` photo-view test still passes; nothing overlaps at 360 by 800.
- [x] 3.4 `npm install @capacitor-community/media@^9.1.0`. New `src/adapters/capacitor-gallery.ts` (`CapacitorGallery implements Gallery`): data URL with `FileReader`, `Media.getAlbumsPath()`, `Media.createAlbum({ name: "The Binder" }).catch(() => {})` (it rejects once the album exists), then `Media.savePhoto({ path, albumIdentifier: \`${albumsPath}/The Binder\`, fileName: name })`. `src/main.tsx`: `ports.gallery = new CapacitorGallery()` in the `Capacitor.isNativePlatform()` block. Do not set `androidGalleryMode`. Verify: `npm run build` passes.
- [x] 3.5 `npx cap sync android`, then `./gradlew assembleDebug` in `android/`. The merged manifest has no new storage permission. Verify: both exit 0; `grep -c "STORAGE\|READ_MEDIA" android/app/build/intermediates/merged_manifests/debug/*/AndroidManifest.xml` shows no new entry compared with the base.
- [x] 3.6 `DESIGN.md`: add `download` to the icon list, and the "Save to phone" button and the status toast to the photo sheet line and the Viewer colour line. Verify: lines present.
- [x] 3.7 `docs/device-checklist.md`, under "Camera and photos": `[photo-download, T-63]` In the full-size view tap the download icon beside the X on the front, switch to the back and save again. Both show "Saved to Photos" and appear in Gallery and Google Photos in a "The Binder" folder, named from the card, as full photos. No permission prompt. In airplane mode, on a card whose full photo was never opened, it says it needs a connection. After installing an update build both photos are still there. Leave it unticked. Verify: line present.
- [x] 3.8 Repo check. Verify: `npm run build && npx vitest run --exclude "**/startup*"` exits 0.

## 4. On the phone

- [ ] 4.1 Owner: on the dev build, save a front and a back and see both in Gallery or Google Photos; the checklist line from 3.7 passes. Verify: ticked after the phone check.
