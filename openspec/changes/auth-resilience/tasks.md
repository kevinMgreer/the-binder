One implementer group; it ends with the repo check green. Java has no test harness, so task 3.5 is verified on the phone (task 4).

## 1. Spec

- [x] 1.1 `openspec validate auth-resilience --strict` passes. Verify: exit 0.

## 2. Tests first

- [x] 2.1 `src/adapters/native-auth.test.ts` (injected map storage): sign-in remembers the email; with a remembered email, `currentUser()` returns it when `silentSignIn` throws, returns null, or `authorize` returns null, and never throws; a following `getAccessToken()` raises `AuthExpiredError` when `authorize` refuses; with no remembered email `currentUser()` is null as before; `signOut()` forgets the email; no token is ever written to storage; `authorize` receives `email`; `dropAccessToken()` clears the cached token and calls `clearToken` once. Verify: the new tests fail on today's code.
- [x] 2.2 `src/adapters/drive-remote-store.test.ts`: a 401 then 200 calls `dropAccessToken`, gets a token again and resolves; 401 then 401 raises `AuthExpiredError` after exactly two sends; a refusal from the second `getAccessToken` raises `AuthExpiredError`; a non-401 error is not retried. Verify: the new tests fail on today's code.
- [x] 2.3 AuthGate component test (next to `src/app/smoke.test.tsx`): with an auth whose `currentUser()` resolves the remembered user, the dashboard shows; with one that returns null, the sign-in screen shows. Verify: runs and passes against the fake.
- [x] 2.4 `e2e/auth.spec.ts`: a launch with a remembered user and an unreachable Google still lists the local cards, and adding a card works. Verify: fails on today's code, or states why the fake cannot show it.

## 3. Implement

- [x] 3.1 `src/ports/index.ts`: add `dropAccessToken(): Promise<void>` to `AuthProvider`; `src/adapters/fakes.ts`: `FakeAuthProvider.dropAccessToken`.
- [x] 3.2 `src/adapters/native-auth.ts`: injectable `storage` option, remember and forget `thebinder.email`, the `currentUser()` fallback per design D1, `dropAccessToken()`, `email` in `authorize` calls. `src/adapters/capacitor-native-auth.ts`: pass `email` through. Verify: 2.1 passes.
- [x] 3.3 `src/adapters/drive-remote-store.ts`: `dropAccessToken` option and the single retry in `request`; `src/main.tsx`: `dropAccessToken: () => ports.auth.dropAccessToken()`. Verify: 2.2 passes.
- [x] 3.4 `src/app/session.tsx` needs no change unless 2.3 shows otherwise. Verify: 2.3 and 2.4 pass.
- [ ] 3.5 `android/.../BinderAuthPlugin.java`: read `email` from the `authorize` call and `setAccount(new Account(email, "com.google"))` on the `AuthorizationRequest` when present. Java has no test harness; verify the build: `npm run build; npx cap sync android; cd android; .\gradlew.bat assembleDebug`.

## 4. Phone checks

- [x] 4.1 `docs/device-checklist.md`, "Per UI change on the phone", two lines tagged `[auth-resilience, T-51]`: (a) airplane-mode cold start: force-stop the app, open it offline, the dashboard and cards show and can be browsed, added and edited; go online and the queued changes sync without signing in; (b) a second Google account on the phone: sign in with each in turn, the Drive folder used is the signed-in account's. Verify: the lines are in the file.
- [ ] 4.2 Owner runs 4.1 on the debug build, and says whether the airplane-mode launch waits noticeably on "checking" (design open question). Verify: lines ticked with the build version, or a desk todo opened for what fails.

## 5. Check

- [x] 5.1 Repo check (`check` in `desk.config.json`) exits 0. Verify: exit code.
