## Why

The release review (T-51) found three ways the sign-in can fail the owner when nothing is wrong with their account.

- Offline cold start. At launch the app asks Google for the signed-in account (`auth.currentUser()`). Offline that fails, and any failure shows "Sign in with Google". The owner cannot browse, add or edit cards, which contradicts drive-storage "Open the app offline".
- A Drive 401 on an aged or revoked token pauses sync at once with "Sign in again", even though a fresh token is one silent call away.
- On a phone with two Google accounts, the Drive token can be issued for a different account than the one that signed in.

## What Changes

- The app remembers the signed-in email on the device (never a token). At launch, with an email remembered, the user is never sent to the sign-in screen because of a network or Google failure: the app opens on the local data as that user. Drive tokens are fetched when sync needs them; if Google then refuses, sync pauses with "Sign in again" and local data stays.
- Only an explicit Sign out forgets the email.
- On a Drive 401 the app drops the token, gets a fresh one and retries the request once. A second 401 pauses sync as today.
- The Drive authorization is made for the account that signed in, so a second account on the phone cannot supply the token.

## Out of scope

- Changing the 55-minute token expiry in the Java plugin (the 401 retry covers an aged token).
- Storing any token or refresh token on the device.
- Changes to the sync engine, card model, release workflow, manifest or worker.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `google-sign-in`: "Sign in with Google" gains the remembered account at launch; "Session renewal" gains the 401 retry; "Sign out" forgets the account; new requirement "Drive access for the signed-in account".
- `drive-storage`: "Local working copy" gains the offline start with Google unreachable.

## Impact

- `src/ports/index.ts`: `AuthProvider.dropAccessToken()`.
- `src/adapters/native-auth.ts`: remembered email (`thebinder.email`, injectable storage), `currentUser()` fallback, `dropAccessToken()`, `email` passed to `authorize`.
- `src/adapters/capacitor-native-auth.ts`: `authorize` options carry `email`.
- `src/adapters/drive-remote-store.ts`: 401 retry once, with a new `dropAccessToken` option; `src/main.tsx` wires it.
- `src/adapters/fakes.ts`: `FakeAuthProvider.dropAccessToken`.
- `android/.../BinderAuthPlugin.java`: `setAccount(new Account(email, "com.google"))` on the Drive `AuthorizationRequest`. Native, so the phone build needs a rebuild; Java has no test harness.
- Tests: `src/adapters/native-auth.test.ts`, `src/adapters/drive-remote-store.test.ts`, an AuthGate component test, `e2e/auth.spec.ts`.
- `docs/device-checklist.md`: two phone checks.
- No new dependency, no cost.
