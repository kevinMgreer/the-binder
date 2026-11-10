# Proposal

## Why

I want to catalog my baseball card collection on my Android phone, with photos, without paying for a server, database or blob storage. Keeping everything in my own Google Drive makes the data mine, free to store, and easy to back up.

This change replaces the-binder. The old app (a .NET API with a hosted database and blob storage behind a web front end) is retired; its code is removed from the repository, its hosting is shut down, and nothing is migrated or imported from it. The Binder starts with an empty collection.

## What Changes

- New Android app, The Binder: a native APK built with Capacitor around a React + Vite + TypeScript UI, installed by sideloading (ADB or Android's advanced sideload flow). No Play Store, no web hosting, no app server.
- Signed release APKs built by GitHub Actions and attached to GitHub Releases; updates install over the previous version without losing local data, and the app tells me when a newer release exists.
- Sign in with Google using Android's native sign-in; the app gets access only to files it creates in Drive.
- Collection data and card photos stored in a dedicated "The Binder" folder in my Drive, with a local copy on the phone so the app works offline and syncs when online.
- Add, edit, delete, search and filter cards, including parallels, serial numbers, grading and quantity.
- Capture front and back photos with the phone's native camera (or pick existing images), compressed before upload.
- Identify a card from its photo two ways: free on-device text recognition by default, or Claude Vision on demand. Either way the result pre-fills the form for me to confirm.
- A tiny free-tier serverless proxy (Cloudflare Worker) that holds the Anthropic API key, so the key is never on the phone, and only answers requests from my Google account.

## Capabilities

### New Capabilities

- `google-sign-in`: Signing in with the owner's Google account and holding Drive access for the session.
- `drive-storage`: Where collection data and photos live in Drive, local caching, offline use and sync between installs.
- `card-catalog`: The card record and adding, editing, deleting, searching and filtering cards.
- `card-photos`: Capturing, compressing, storing and displaying front and back card photos.
- `card-identification`: Turning a card photo into suggested card details via on-device recognition or Claude Vision.
- `app-distribution`: Installing the signed APK without the Play Store, updating it in place without losing data, showing the app version, and checking GitHub Releases for a newer APK.

### Modified Capabilities

None (new project; no capabilities carry over from the old app).

## Out of Scope

- Card pricing and collection value. eBay's Finding API is retired and the Browse API only shows active listings, so pricing gets its own change once a free sold-price source is chosen.
- Multiple users, sharing or public collection pages.
- Play Store distribution.
- iOS.
- Web, PWA or desktop versions of the app.
- Migrating or importing anything from the old the-binder app, or importing spreadsheets or checklists.
- Set checklists and "missing cards" tracking.

## Impact

- Repository: the-binder's old .NET/web code is replaced by this project (Capacitor Android app plus one Cloudflare Worker for the Vision proxy). The old GitHub repository is renamed `the-binder-legacy` and stays private with its history; a new public `the-binder` repository starts from fresh history with no personal information or secrets.
- External dependencies: Android Credential Manager and Google authorization (via Capacitor plugin), Google Drive API v3, Google ML Kit on-device text recognition, Anthropic Messages API (via proxy), Cloudflare Workers free plan, GitHub Actions and GitHub Releases.
- Google Cloud project with the Drive API enabled, a web OAuth client and Android OAuth clients (package name + SHA-1 for the debug and release keys); no billing account.
- The old the-binder hosting is shut down.
- Cost: $0 except Claude Vision calls, which only happen when I tap "Identify with Claude".
