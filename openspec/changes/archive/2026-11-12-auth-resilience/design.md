## Context

`AuthGate` (`src/app/session.tsx`) calls `auth.currentUser()` once at launch and shows the sign-in screen on null or a throw. `NativeGoogleAuthProvider.currentUser()` (`src/adapters/native-auth.ts`) runs `silentSignIn` and a non-interactive `authorize`, both of which need Google. `DriveRemoteStore.request` throws `AuthExpiredError` on any 401. Tokens live in memory only.

## Goals / Non-Goals

**Goals:** a launch that never signs the owner out because of network or Google trouble; one silent retry on a 401; a Drive token for the account that signed in.

**Non-Goals:** persisting tokens, changing the token lifetime, changing sync.

## Decisions

### D1. Remember the email, not tokens

The provider writes the email to `localStorage` key `thebinder.email` after `signIn()` and after a successful silent `currentUser()`. The storage is an injectable option (default `localStorage`), so tests use a map. Only `signOut()` removes it. The email is not a secret and is already shown in Settings.

`currentUser()`:
- No remembered email: unchanged (silent path; null goes to the sign-in screen).
- A remembered email: never throws and never returns null. Try the silent path; on success use its account (and refresh the remembered email). On any failure or null, return `{ email }` with no tokens.

Tokens then come from `getAccessToken()` (non-interactive `authorize`) when sync needs them. If Google refuses, `AuthExpiredError` is raised, sync pauses with "Sign in again", local data stays. That is the existing "Silent renewal fails" scenario, now reachable from a cold start.

`getIdToken()` already guards on `this.user`, so it works with the remembered user.

Alternative: persist tokens. Rejected: tokens at rest on the device is a security cost for a problem the email solves.

Trade-off: if the Google account was removed from the phone, the owner opens the app and sees local data and "Sign in again" instead of the sign-in screen. Acceptable; the data is theirs and the prompt appears when sync runs.

### D2. Retry a 401 once

`AuthProvider.dropAccessToken()` clears the in-memory access token and calls the plugin `clearToken` for the issued token (the existing `dropIssued`). `DriveRemoteStore` gets an option `dropAccessToken`. In `request`, on a 401: call it, get a token again (which re-authorizes non-interactively), send the request once more. A second 401, or a refusal from `getAccessToken`, raises `AuthExpiredError`. The request body is a `Blob` or string, so it can be sent twice. The Java 55-minute expiry stays.

### D3. Pin the Drive account

`authorize` options gain `email`. `NativeGoogleAuthProvider` passes the user's email (`this.user.email`) on every call; `signIn()` passes the email it just got. `BinderAuthPlugin.java` calls `setAccount(new Account(email, "com.google"))` on the `AuthorizationRequest` when `email` is present. Java has no test harness here; the phone check covers it.

## Risks / Trade-offs

- [`silentSignIn` hangs offline instead of failing] → open question below; a timeout would be added only if the phone shows a hang.
- [Java change is unverified by tests] → the phone checks in tasks 4.

## Open Questions

- Does `silentSignIn` return quickly in airplane mode on the phone? If it waits for a long timeout, the launch shows "checking" for that long, and D1 needs a short timeout around the silent path.
